import express from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initDb, load, save, backend } from "./db.js";

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
  const { title, date, endDate, done } = req.body;
  if (title !== undefined) subtask.title = title;
  if (date !== undefined) subtask.date = date;
  if (endDate !== undefined) subtask.endDate = endDate || null;
  if (done !== undefined) {
    subtask.done = !!done;
    subtask.doneAt = subtask.done ? now() : null;
  }
  persist();
  res.json(subtask);
});

app.delete("/api/subtasks/:id", (req, res) => {
  state.subtasks = state.subtasks.filter((s) => s.id !== req.params.id);
  persist();
  res.json({ ok: true });
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
