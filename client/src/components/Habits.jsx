import { useState } from "react";
import { api } from "../api.js";
import { todayStr, isHabitDoneOn, habitStreak, habitWeekProgress } from "../insights.js";

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
      <button className="btn btn-ghost btn-small" onClick={() => setOpen(true)}>
        ＋ Add habit
      </button>
    );
  }
  return (
    <form className="form-card" onSubmit={submit}>
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

function HabitRow({ habit, habitLogs, refresh }) {
  const [editing, setEditing] = useState(false);
  const today = todayStr();
  const done = isHabitDoneOn(habit, habitLogs, today);
  const isWeekly = habit.frequency === "weekly";
  const streakCount = habitStreak(habit, habitLogs);
  const weekProgress = isWeekly ? habitWeekProgress(habit, habitLogs) : null;

  if (editing) {
    return (
      <HabitEditForm
        habit={habit}
        onSaved={() => {
          setEditing(false);
          refresh();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const toggle = async () => {
    await api.logHabit(habit.id, today, !done);
    refresh();
  };

  return (
    <li className={done ? "done" : ""}>
      <label>
        <input type="checkbox" checked={done} onChange={toggle} />
        <span className="cal-dot" style={{ background: habit.color }} />
        <span className="task-title">{habit.title}</span>
      </label>
      <span className="habit-streak" style={{ color: habit.color }}>
        {isWeekly ? `${weekProgress.hits}/${weekProgress.target} this wk` : `🔥 ${streakCount}d`}
      </span>
      <span className="row-actions">
        <button className="btn-icon" title="Edit habit" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          className="btn-icon btn-danger"
          title="Delete habit"
          onClick={async () => {
            if (confirm(`Delete habit "${habit.title}"?`)) {
              await api.deleteHabit(habit.id);
              refresh();
            }
          }}
        >
          ✕
        </button>
      </span>
    </li>
  );
}

export default function Habits({ data, refresh }) {
  const habits = data.habits || [];
  const habitLogs = data.habitLogs || [];

  return (
    <section className="card">
      <div className="card-head">
        <h3>Daily habits</h3>
      </div>
      {habits.length > 0 ? (
        <ul className="task-list">
          {habits.map((h) => (
            <HabitRow key={h.id} habit={h} habitLogs={habitLogs} refresh={refresh} />
          ))}
        </ul>
      ) : (
        <p className="hint">No habits yet — add one to track daily (gym, water, sleep…).</p>
      )}
      <HabitForm onSaved={refresh} />
    </section>
  );
}
