import { useState } from "react";
import { api } from "../api.js";
import {
  todayStr,
  addDays,
  fmtDate,
  isHabitDoneOn,
  habitStreak,
  habitWeekProgress,
  habitLastNDays,
} from "../insights.js";

const HABIT_COLORS = ["#0078D4", "#E81B23", "#107C10", "#D97706", "#7D3C98", "#00A4EF"];

function HabitFields({ form, setForm }) {
  return (
    <>
      <input
        placeholder="Habit, e.g. Gym / 10k steps / Sleep by 11"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
        autoFocus
      />
      <div className="form-row">
        <label>
          Frequency
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
          >
            <option value="daily">Every day</option>
            <option value="weekly">N times a week</option>
          </select>
        </label>
        {form.frequency === "weekly" && (
          <label>
            Times / week
            <input
              type="number"
              min="1"
              max="6"
              value={form.timesPerWeek}
              onChange={(e) => setForm({ ...form, timesPerWeek: e.target.value })}
            />
          </label>
        )}
      </div>
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

function HabitForm({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    frequency: "daily",
    timesPerWeek: 3,
    color: HABIT_COLORS[0],
  });

  const submit = async (e) => {
    e.preventDefault();
    await api.addHabit(form);
    setForm({ title: "", frequency: "daily", timesPerWeek: 3, color: HABIT_COLORS[0] });
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
    frequency: habit.frequency,
    timesPerWeek: habit.timesPerWeek,
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

// Monday-aligned, GitHub-style history: one column per week (oldest left),
// one row per weekday. Future cells are hidden to keep the grid aligned.
function Heatmap({ habit, habitLogs, weeks = 12 }) {
  const today = todayStr();
  const done = new Set(
    habitLogs.filter((l) => l.habitId === habit.id && l.done).map((l) => l.date)
  );
  const mondayOffset = (new Date(today + "T00:00:00").getDay() + 6) % 7; // Mon = 0
  const thisMonday = addDays(today, -mondayOffset);

  const cells = [];
  for (let w = weeks - 1; w >= 0; w--) {
    for (let r = 0; r < 7; r++) {
      const date = addDays(thisMonday, -w * 7 + r);
      cells.push({ date, future: date > today, hit: done.has(date) });
    }
  }

  return (
    <div className="hm" title={`Last ${weeks} weeks`}>
      {cells.map((c) => (
        <span
          key={c.date}
          className={`hm-cell ${c.future ? "future" : ""}`}
          style={c.hit ? { background: habit.color } : undefined}
          title={c.future ? undefined : `${fmtDate(c.date)} — ${c.hit ? "done" : "not done"}`}
        />
      ))}
    </div>
  );
}

// One habit = one card: today's check-in, streak/consistency chips, and the
// 12-week heatmap — everything about the habit in a single glance.
function HabitCard({ habit, habitLogs, refresh }) {
  const [editing, setEditing] = useState(false);
  const today = todayStr();
  const done = isHabitDoneOn(habit, habitLogs, today);
  const isWeekly = habit.frequency === "weekly";
  const streakCount = habitStreak(habit, habitLogs);
  const week = habitWeekProgress(habit, habitLogs);
  const last30 = habitLastNDays(habit, habitLogs, 30).filter((d) => d.done).length;

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
      className={`card habit-card ${done ? "done-today" : ""}`}
      style={{ "--habit-color": habit.color }}
    >
      <div className="habit-card-head">
        <label className="habit-check">
          <input
            type="checkbox"
            checked={done}
            onChange={async () => {
              await api.logHabit(habit.id, today, !done);
              refresh();
            }}
          />
          <span className="cal-dot" style={{ background: habit.color }} />
          <span className="habit-name">{habit.title}</span>
        </label>
        <span className="row-actions">
          <button className="btn-icon" title="Edit habit" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button
            className="btn-icon btn-danger"
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

      <div className="habit-chips">
        <span className="chip chip-grey">{isWeekly ? `${habit.timesPerWeek}×/week` : "Daily"}</span>
        <span className={`chip ${streakCount > 0 ? "chip-gold" : "chip-grey"}`}>
          🔥 {streakCount} {isWeekly ? "wk" : "d"}
        </span>
        <span className={`chip ${week.hits >= week.target ? "chip-green" : "chip-grey"}`}>
          This wk {week.hits}/{week.target}
        </span>
        <span className="chip chip-grey">30d · {last30}</span>
      </div>

      <Heatmap habit={habit} habitLogs={habitLogs} />
    </section>
  );
}

export default function HabitsPage({ data, refresh }) {
  const habits = data.habits || [];
  const habitLogs = data.habitLogs || [];
  const today = todayStr();

  const doneToday = habits.filter((h) => isHabitDoneOn(h, habitLogs, today)).length;
  const best = habits.reduce((b, h) => {
    const s = habitStreak(h, habitLogs);
    return !b || s > b.s ? { h, s } : b;
  }, null);
  const checkins30 = habits.reduce(
    (sum, h) => sum + habitLastNDays(h, habitLogs, 30).filter((d) => d.done).length,
    0
  );

  return (
    <div className="habits-page">
      {habits.length > 0 && (
        <section className="card stat-row">
          <div className="stat">
            <span className="stat-num c2">
              {doneToday}/{habits.length}
            </span>
            <span className="stat-label">done today</span>
          </div>
          <div className="stat">
            <span className="stat-num c1">{best ? best.s : 0}</span>
            <span className="stat-label">
              best streak{best && best.s > 0 ? ` · ${best.h.title}` : ""}
            </span>
          </div>
          <div className="stat">
            <span className="stat-num c3">{checkins30}</span>
            <span className="stat-label">check-ins (30d)</span>
          </div>
        </section>
      )}

      <HabitForm onSaved={refresh} />

      {habits.length === 0 ? (
        <section className="card empty-state">
          <h3>No habits yet</h3>
          <p>
            Add recurring routines — gym, water, sleep — and tick them off daily. Streaks and a
            12-week history build up here automatically.
          </p>
        </section>
      ) : (
        <div className="habit-grid">
          {habits.map((h) => (
            <HabitCard key={h.id} habit={h} habitLogs={habitLogs} refresh={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
