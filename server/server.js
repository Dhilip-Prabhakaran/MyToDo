import express from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initDb, load, save, backend, writeBackup } from "./db.js";

const app = express();
app.use(cors());
// Roomy limit: documents carry long-form worksheet text.
app.use(express.json({ limit: "8mb" }));

await initDb();
let state = await load();
const persist = () => save(state).catch((e) => console.error("Persist failed:", e));
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// ---------- read everything ----------
app.get("/api/state", (req, res) => res.json(state));

// ---------- targets ----------
app.post("/api/targets", (req, res) => {
  const { title, description = "", color = "#d97757", startDate, targetDate } = req.body;
  if (!title || !startDate || !targetDate) {
    return res.status(400).json({ error: "title, startDate and targetDate are required" });
  }
  const target = { id: id(), title, description, color, startDate, targetDate, createdAt: now() };
  state.targets.push(target);
  persist();
  res.status(201).json(target);
});

app.put("/api/targets/:id", (req, res) => {
  const target = state.targets.find((t) => t.id === req.params.id);
  if (!target) return res.status(404).json({ error: "target not found" });
  const { title, description, color, startDate, targetDate } = req.body;
  Object.assign(target, {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(color !== undefined && { color }),
    ...(startDate !== undefined && { startDate }),
    ...(targetDate !== undefined && { targetDate }),
  });
  persist();
  res.json(target);
});

app.delete("/api/targets/:id", (req, res) => {
  const targetId = req.params.id;
  const milestoneIds = new Set(
    state.milestones.filter((m) => m.targetId === targetId).map((m) => m.id)
  );
  state.targets = state.targets.filter((t) => t.id !== targetId);
  state.milestones = state.milestones.filter((m) => m.targetId !== targetId);
  state.subtasks = state.subtasks.filter((s) => !milestoneIds.has(s.milestoneId));
  persist();
  res.json({ ok: true });
});

// ---------- milestones ----------
app.post("/api/targets/:targetId/milestones", (req, res) => {
  const target = state.targets.find((t) => t.id === req.params.targetId);
  if (!target) return res.status(404).json({ error: "target not found" });
  const { title, startDate, dueDate } = req.body;
  if (!title || !dueDate) {
    return res.status(400).json({ error: "title and dueDate are required" });
  }
  const milestone = {
    id: id(),
    targetId: target.id,
    title,
    startDate: startDate || new Date().toLocaleDateString("en-CA"),
    dueDate,
    order: state.milestones.filter((m) => m.targetId === target.id).length,
    createdAt: now(),
  };
  state.milestones.push(milestone);
  persist();
  res.status(201).json(milestone);
});

// Reorder a target's milestones: body is {ids: [...]} in the desired order.
app.put("/api/targets/:targetId/milestones/order", (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids array is required" });
  ids.forEach((mid, i) => {
    const m = state.milestones.find((x) => x.id === mid && x.targetId === req.params.targetId);
    if (m) m.order = i;
  });
  persist();
  res.json({ ok: true });
});

app.put("/api/milestones/:id", (req, res) => {
  const milestone = state.milestones.find((m) => m.id === req.params.id);
  if (!milestone) return res.status(404).json({ error: "milestone not found" });
  const { title, startDate, dueDate } = req.body;
  Object.assign(milestone, {
    ...(title !== undefined && { title }),
    ...(startDate !== undefined && { startDate }),
    ...(dueDate !== undefined && { dueDate }),
  });
  persist();
  res.json(milestone);
});

app.delete("/api/milestones/:id", (req, res) => {
  state.milestones = state.milestones.filter((m) => m.id !== req.params.id);
  state.subtasks = state.subtasks.filter((s) => s.milestoneId !== req.params.id);
  persist();
  res.json({ ok: true });
});

// ---------- subtasks (daily tasks) ----------
app.post("/api/milestones/:milestoneId/subtasks", (req, res) => {
  const milestone = state.milestones.find((m) => m.id === req.params.milestoneId);
  if (!milestone) return res.status(404).json({ error: "milestone not found" });
  // Two ways to use a date range:
  //  - mode "single" (default when endDate given): ONE task spanning date..endDate
  //  - mode "daily": a separate task on each day (same as repeatDays)
  const { title, date, repeatDays = 1, endDate, mode = "single" } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: "title and date are required" });
  }

  if (endDate && endDate > date && mode === "single") {
    const task = {
      id: id(),
      milestoneId: milestone.id,
      title,
      date,
      endDate,
      done: false,
      doneAt: null,
      createdAt: now(),
    };
    state.subtasks.push(task);
    persist();
    return res.status(201).json([task]);
  }

  let days = Math.min(Math.max(parseInt(repeatDays, 10) || 1, 1), 90);
  if (endDate) {
    const span =
      Math.round(
        (new Date(endDate + "T00:00:00") - new Date(date + "T00:00:00")) / 86400000
      ) + 1;
    days = Math.min(Math.max(span, 1), 180);
  }
  const created = [];
  const start = new Date(date + "T00:00:00");
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    created.push({
      id: id(),
      milestoneId: milestone.id,
      title,
      date: d.toLocaleDateString("en-CA"),
      done: false,
      doneAt: null,
      createdAt: now(),
    });
  }
  state.subtasks.push(...created);
  persist();
  res.status(201).json(created);
});

app.put("/api/subtasks/:id", (req, res) => {
  const subtask = state.subtasks.find((s) => s.id === req.params.id);
  if (!subtask) return res.status(404).json({ error: "subtask not found" });
  const { title, date, endDate, done, priority, progress } = req.body;
  if (title !== undefined) subtask.title = title;
  if (date !== undefined) subtask.date = date;
  if (endDate !== undefined) subtask.endDate = endDate || null;
  if (priority !== undefined) subtask.priority = !!priority;
  // Manual progress for multi-day (spanning) tasks: 0–100.
  if (progress !== undefined) {
    subtask.progress = Math.min(Math.max(parseInt(progress, 10) || 0, 0), 100);
  }
  if (done !== undefined) {
    subtask.done = !!done;
    subtask.doneAt = subtask.done ? now() : null;
    if (subtask.done) subtask.progress = 100; // completing implies full progress
  }
  persist();
  res.json(subtask);
});

app.delete("/api/subtasks/:id", (req, res) => {
  state.subtasks = state.subtasks.filter((s) => s.id !== req.params.id);
  persist();
  res.json({ ok: true });
});

// ---------- habits (recurring, no end date — separate from Targets) ----------
app.post("/api/habits", (req, res) => {
  const { title, frequency = "daily", timesPerWeek = 7, color = "#0078D4" } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });
  const habit = {
    id: id(),
    title,
    frequency, // "daily" | "weekly"
    timesPerWeek:
      frequency === "weekly" ? Math.min(Math.max(parseInt(timesPerWeek, 10) || 1, 1), 6) : 7,
    color,
    createdAt: now(),
  };
  state.habits.push(habit);
  persist();
  res.status(201).json(habit);
});

app.put("/api/habits/:id", (req, res) => {
  const habit = state.habits.find((h) => h.id === req.params.id);
  if (!habit) return res.status(404).json({ error: "habit not found" });
  const { title, frequency, timesPerWeek, color } = req.body;
  Object.assign(habit, {
    ...(title !== undefined && { title }),
    ...(frequency !== undefined && { frequency }),
    ...(timesPerWeek !== undefined && {
      timesPerWeek: Math.min(Math.max(parseInt(timesPerWeek, 10) || 1, 1), 6),
    }),
    ...(color !== undefined && { color }),
  });
  persist();
  res.json(habit);
});

app.delete("/api/habits/:id", (req, res) => {
  state.habits = state.habits.filter((h) => h.id !== req.params.id);
  state.habitLogs = state.habitLogs.filter((l) => l.habitId !== req.params.id);
  persist();
  res.json({ ok: true });
});

// Upsert a habit's completion log for one date — the checkbox on Home ticks this.
app.put("/api/habits/:id/log", (req, res) => {
  const habit = state.habits.find((h) => h.id === req.params.id);
  if (!habit) return res.status(404).json({ error: "habit not found" });
  const { date, done } = req.body;
  if (!date) return res.status(400).json({ error: "date is required" });
  const existing = state.habitLogs.find((l) => l.habitId === habit.id && l.date === date);
  if (done) {
    if (existing) existing.doneAt = now();
    else state.habitLogs.push({ id: id(), habitId: habit.id, date, done: true, doneAt: now() });
  } else if (existing) {
    state.habitLogs = state.habitLogs.filter((l) => l.id !== existing.id);
  }
  persist();
  res.json({ ok: true });
});

// ---------- working-document versions (Templates page) ----------
// One living document per template, stored as immutable full-text snapshots:
// saving always APPENDS the next version (v1, v2, …) — history is never edited.
// Sections are per-section plain text keyed by the template's section keys.
app.post("/api/docs/:templateId/versions", (req, res) => {
  const { sections, note = "" } = req.body;
  if (!sections || typeof sections !== "object" || Array.isArray(sections)) {
    return res.status(400).json({ error: "sections object is required" });
  }
  const templateId = req.params.templateId;
  const latest = state.docVersions
    .filter((v) => v.templateId === templateId)
    .reduce((m, v) => Math.max(m, v.version), 0);
  const version = {
    id: id(),
    templateId,
    version: latest + 1,
    note: String(note).slice(0, 200),
    sections,
    createdAt: now(),
  };
  state.docVersions.push(version);
  persist();
  res.status(201).json(version);
});

// Escape hatch for a mistaken save — the UI only offers this on the newest version.
app.delete("/api/doc-versions/:id", (req, res) => {
  state.docVersions = state.docVersions.filter((v) => v.id !== req.params.id);
  persist();
  res.json({ ok: true });
});

// ---------- restore from an exported backup ----------
// Body is the JSON produced by the Export button (or a rolling snapshot from
// server/data/backups). Replaces the whole state; the outgoing state is first
// written as a labelled safety snapshot so a mistaken import is recoverable.
const STATE_KEYS = ["targets", "milestones", "subtasks", "habits", "habitLogs", "docVersions"];

app.post("/api/restore", (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || !STATE_KEYS.some((k) => Array.isArray(body[k]))) {
    return res.status(400).json({ error: "not a MyToDo backup: no data arrays found" });
  }
  const bad = STATE_KEYS.find((k) => body[k] !== undefined && !Array.isArray(body[k]));
  if (bad) return res.status(400).json({ error: `field "${bad}" must be an array` });

  writeBackup(state, `pre-restore-${Date.now()}.json`);
  state = Object.fromEntries(STATE_KEYS.map((k) => [k, body[k] || []]));
  persist();
  res.json({
    ok: true,
    counts: Object.fromEntries(STATE_KEYS.map((k) => [k, state[k].length])),
  });
});

// ---------- serve the built frontend in production ----------
const clientDist = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "client",
  "dist"
);
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`MyToDo server running on http://localhost:${PORT} — storage: ${backend}`)
);
