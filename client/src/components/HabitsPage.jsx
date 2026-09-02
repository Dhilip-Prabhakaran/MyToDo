import { useState } from "react";
import { api } from "../api.js";
import {
  todayStr,
  fmtDate,
  todayScore,
  dayScore,
  lastNDaysScore,
  habitStreak,
  habitLastNDays,
  habitValueOn,
  habitPointsOn,
} from "../insights.js";
import ProgressRing from "./ProgressRing.jsx";
import HabitsReport from "./HabitsReport.jsx";

const HABIT_COLORS = ["#0078D4", "#E81B23", "#107C10", "#D97706", "#7D3C98", "#00A4EF"];
const LEVELS = [0, 25, 50, 75, 100];
const ACCENT_RGB = "217,119,87";

function HabitFields({ form, setForm }) {
  return (
    <>
      <input
        placeholder="Habit name, e.g. Gym / Protein intake / Zero sugar"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
        autoFocus
      />
      <div className="form-row">
        <label>
          Points
          <input
            type="number"
            min="0"
            max="100"
            value={form.points}
            onChange={(e) => setForm({ ...form, points: e.target.value })}
          />
        </label>
        <label>
          Scoring
          <select
            value={form.scoreType}
            onChange={(e) => setForm({ ...form, scoreType: e.target.value })}
          >
            <option value="binary">Done / not</option>
            <option value="graded">Graded (intake level)</option>
          </select>
        </label>
        <label>
          Rest days / week
          <input
            type="number"
            min="0"
            max="7"
            value={form.restAllowance}
            onChange={(e) => setForm({ ...form, restAllowance: e.target.value })}
          />
        </label>
      </div>
      {form.scoreType === "graded" && (
        <input
          placeholder="Target for 100%, e.g. 100 g protein · 8 glasses · 30 g fibre"
          value={form.target}
          onChange={(e) => setForm({ ...form, target: e.target.value })}
        />
      )}
      <div className="swatches">
        {HABIT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`swatch ${form.color === c ? "selected" : ""}`}
            style={{ background: c }}
            onClick={() => setForm({ ...form, color: c })}
          />
        ))}
      </div>
    </>
  );
}

const blankHabit = () => ({
  title: "",
  points: 10,
  scoreType: "binary",
  target: "",
  restAllowance: 0,
  color: HABIT_COLORS[0],
});

function HabitForm({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankHabit);

  const submit = async (e) => {
    e.preventDefault();
    await api.addHabit(form);
    setForm(blankHabit());
    setOpen(false);
    onSaved();
  };

  if (!open) {
    return (
      <div className="habits-toolbar">
        <button className="btn btn-small" onClick={() => setOpen(true)}>
          ＋ Add habit
        </button>
      </div>
    );
  }
  return (
    <form className="card form-card" onSubmit={submit}>
      <h3>New habit</h3>
      <HabitFields form={form} setForm={setForm} />
      <div className="form-actions">
        <button type="submit" className="btn btn-small">
          Save
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function HabitEditForm({ habit, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: habit.title,
    points: habit.points ?? 10,
    scoreType: habit.scoreType ?? "binary",
    target: habit.target ?? "",
    restAllowance: habit.restAllowance ?? 0,
    color: habit.color,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await api.updateHabit(habit.id, form);
    setSaving(false);
    onSaved();
  };

  return (
    <form className="form-card" onSubmit={submit}>
      <h3>Edit habit</h3>
      <HabitFields form={form} setForm={setForm} />
      <div className="form-actions">
        <button type="submit" className="btn btn-small" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function LevelPicker({ value, color, onPick, disabled }) {
  return (
    <div className={`lvl-picker ${disabled ? "disabled" : ""}`}>
      {LEVELS.map((l) => (
        <button
          key={l}
          type="button"
          disabled={disabled}
          className={`lvl-btn ${value === l ? "active" : ""}`}
          style={value === l && l > 0 ? { background: color, borderColor: color } : undefined}
          onClick={() => onPick(l)}
        >
          {l}%
        </button>
      ))}
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["M", "T", "W", "T", "F", "S", "S"];
const FILL_ALPHA = [0, 0.32, 0.55, 0.8, 1];

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - mondayOffset + i);
    cells.push({
      date: d.toLocaleDateString("en-CA"),
      day: d.getDate(),
      outside: d.getMonth() !== month,
    });
  }
  return cells;
}

const fullDate = (dateStr) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

// Compact score calendar + a detail panel for the selected day. The calendar is
// small (fixed width) and shaded by each day's overall score; click a day to see
// its breakdown on the right, where each habit can be toggled for that day.
function HistorySection({ data, refresh }) {
  const habits = data.habits || [];
  const logs = data.habitLogs || [];
  const today = todayStr();
  const [y0, m0] = today.split("-").map(Number);
  const [view, setView] = useState({ year: y0, month: m0 - 1 });
  const [selected, setSelected] = useState(today);

  const cells = buildMonthGrid(view.year, view.month);
  const canNext = view.year < y0 || (view.year === y0 && view.month < m0 - 1);
  const step = (delta) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const detail = dayScore(habits, logs, selected);

  const toggleOnSelected = async (h) => {
    const v = habitValueOn(logs, h.id, selected);
    await api.logHabit(h.id, selected, { value: v > 0 ? 0 : 100 });
    refresh();
  };

  return (
    <section className="card hist-card">
      <div className="card-head">
        <h3>History</h3>
        <span className="habit-cal-nav">
          <button type="button" className="btn-icon" onClick={() => step(-1)} title="Previous month">
            ‹
          </button>
          <span className="hist-month">
            {MONTHS[view.month]} {view.year}
          </span>
          <button
            type="button"
            className="btn-icon"
            onClick={() => step(1)}
            disabled={!canNext}
            title="Next month"
          >
            ›
          </button>
        </span>
      </div>

      <div className="hist-layout">
        <div className="hist-cal">
          <div className="hist-grid">
            {DOW.map((d, i) => (
              <span key={i} className="hist-dow">
                {d}
              </span>
            ))}
            {cells.map((c) => {
              const future = c.date > today;
              const disabled = c.outside || future;
              const pct = disabled ? 0 : dayScore(habits, logs, c.date).pct;
              const level = pct <= 0 ? 0 : pct < 25 ? 1 : pct < 50 ? 2 : pct < 75 ? 3 : 4;
              const bg = level ? `rgba(${ACCENT_RGB},${FILL_ALPHA[level]})` : undefined;
              return (
                <button
                  key={c.date}
                  type="button"
                  disabled={disabled}
                  className={[
                    "hist-cell",
                    c.outside ? "outside" : "",
                    future ? "future" : "",
                    c.date === today ? "today" : "",
                    c.date === selected ? "selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    bg ? { background: bg, borderColor: bg, color: level >= 3 ? "#fff" : "var(--ink)" } : undefined
                  }
                  title={disabled ? undefined : `${fmtDate(c.date)} — score ${dayScore(habits, logs, c.date).earned}/${detail.max}`}
                  onClick={() => !disabled && setSelected(c.date)}
                >
                  {c.day}
                </button>
              );
            })}
          </div>
          <p className="hist-legend">Darker = higher score. Tap a day for its detail.</p>
        </div>

        <div className="hist-detail">
          <div className="hd-head">
            <span className="hd-date">
              {fullDate(selected)}
              {selected === today ? " · today" : ""}
            </span>
            <span className="hd-score">
              {detail.earned}
              <span> / {detail.max}</span>
            </span>
          </div>
          <div className="hs-bar">
            <div className="hs-fill" style={{ width: `${detail.pct}%` }} />
          </div>
          {habits.length === 0 ? (
            <p className="hint">No habits yet.</p>
          ) : (
            <ul className="hd-list">
              {habits.map((h) => {
                const value = habitValueOn(logs, h.id, selected);
                const earned = habitPointsOn(h, logs, selected);
                const log = logs.find((l) => l.habitId === h.id && l.date === selected);
                const graded = h.scoreType === "graded";
                const tag = log?.rest ? "Rest" : value > 0 ? (graded ? `${value}%` : "✓") : "—";
                return (
                  <li
                    key={h.id}
                    className={value > 0 ? "" : "muted"}
                    title="Click to toggle for this day"
                    onClick={() => toggleOnSelected(h)}
                  >
                    <span className="cal-dot" style={{ background: h.color }} />
                    <span className="hd-name">{h.title}</span>
                    <span className="hd-tag">{tag}</span>
                    <span className="hd-pts">
                      {earned}/{h.points ?? 10}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function HabitCard({ habit, habitLogs, refresh }) {
  const [editing, setEditing] = useState(false);
  const today = todayStr();
  const points = habit.points ?? 10;
  const graded = habit.scoreType === "graded";
  const restAllowed = (habit.restAllowance ?? 0) > 0;

  const log = habitLogs.find((l) => l.habitId === habit.id && l.date === today);
  const value = log ? (log.value ?? (log.done ? 100 : 0)) : 0;
  const isRest = !!log?.rest;
  const earned = habitPointsOn(habit, habitLogs, today);
  const streakCount = habitStreak(habit, habitLogs);
  const last30 = habitLastNDays(habit, habitLogs, 30).filter((d) => d.done).length;

  const write = async (opts) => {
    await api.logHabit(habit.id, today, opts);
    refresh();
  };

  if (editing) {
    return (
      <section className="card habit-card">
        <HabitEditForm
          habit={habit}
          onSaved={() => {
            setEditing(false);
            refresh();
          }}
          onCancel={() => setEditing(false)}
        />
      </section>
    );
  }

  return (
    <section
      className={`card habit-card ${value > 0 ? "done-today" : ""} ${isRest ? "is-rest" : ""}`}
      style={{ "--habit-color": habit.color }}
    >
      <div className="habit-card-top">
        <span className="cal-dot" style={{ background: habit.color }} />
        <span className="habit-name">{habit.title}</span>
        <span className="habit-card-actions">
          <button className="hc-icon" title="Edit habit" onClick={() => setEditing(true)}>
            ✎
          </button>
          <button
            className="hc-icon hc-del"
            title="Delete habit"
            onClick={async () => {
              if (confirm(`Delete habit "${habit.title}" and its history?`)) {
                await api.deleteHabit(habit.id);
                refresh();
              }
            }}
          >
            ✕
          </button>
        </span>
      </div>

      {graded && habit.target ? (
        <p className="habit-target">Target · {habit.target}</p>
      ) : (
        <p className="habit-target subtle">{graded ? "Intake level" : "Done / not"}</p>
      )}

      <div className="habit-log">
        {graded ? (
          <LevelPicker
            value={isRest ? null : value}
            color={habit.color}
            disabled={isRest}
            onPick={(v) => write({ value: v })}
          />
        ) : (
          <button
            type="button"
            className={`habit-toggle ${value > 0 && !isRest ? "on" : ""}`}
            style={value > 0 && !isRest ? { background: habit.color, borderColor: habit.color } : undefined}
            onClick={() => write({ value: value > 0 && !isRest ? 0 : 100 })}
          >
            {value > 0 && !isRest ? "✓ Done" : "Mark done"}
          </button>
        )}
        {restAllowed && (
          <button
            type="button"
            className={`rest-btn ${isRest ? "on" : ""}`}
            title="Mark a rest day (earns points within your weekly allowance)"
            onClick={() => write(isRest ? { value: 0 } : { rest: true })}
          >
            {isRest ? "Resting" : "Rest"}
          </button>
        )}
      </div>

      <div className="habit-foot">
        <span className="habit-foot-score" style={{ color: habit.color }}>
          {earned}
          <span>/{points} pts</span>
        </span>
        <span className="habit-foot-meta">
          🔥 {streakCount}d · {last30}/30
        </span>
      </div>
    </section>
  );
}

export default function HabitsPage({ data, refresh }) {
  const [report, setReport] = useState(false);
  const habits = data.habits || [];
  const habitLogs = data.habitLogs || [];

  if (report) {
    return <HabitsReport data={data} onBack={() => setReport(false)} />;
  }

  const { earned, max, pct } = todayScore(habits, habitLogs);
  const week = lastNDaysScore(habits, habitLogs, 7);
  const avg7 =
    week.length && max ? Math.round(week.reduce((s, d) => s + d.pct, 0) / week.length) : 0;
  const best = habits.reduce((b, h) => {
    const s = habitStreak(h, habitLogs);
    return !b || s > b.s ? { h, s } : b;
  }, null);

  if (habits.length === 0) {
    return (
      <div className="habits-empty">
        <HabitForm onSaved={refresh} />
        <section className="card empty-state">
          <h3>No habits yet</h3>
          <p>
            Add your dos and don'ts — each with a point value. Tick them off daily and your health
            score builds up here. Intake habits (protein, water) can be scored by level.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="habits-page">
      <div className="habits-side">
        <section className="card habit-score-hero">
          <div className="hs-text">
            <p className="eyebrow">Today's health score</p>
            <div className="hs-num">
              <span className="hs-earned">{earned}</span>
              <span className="hs-max"> / {max}</span>
            </div>
            <div className="hs-bar">
              <div className="hs-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="stat-chips">
              <span className="chip">
                7-day avg <strong>{avg7}%</strong>
              </span>
              {best && best.s > 0 && (
                <span className="chip">
                  Best streak <strong>{best.s}d · {best.h.title}</strong>
                </span>
              )}
            </div>
            <button className="btn btn-small hs-report-btn" onClick={() => setReport(true)}>
              📊 Analytics & report
            </button>
          </div>
          <ProgressRing value={pct} size={96} label="today" />
        </section>

        <HistorySection data={data} refresh={refresh} />
      </div>

      <div className="habits-main">
        <HabitForm onSaved={refresh} />
        <div className="habit-grid">
          {habits.map((h) => (
            <HabitCard key={h.id} habit={h} habitLogs={habitLogs} refresh={refresh} />
          ))}
        </div>
      </div>
    </div>
  );
}
