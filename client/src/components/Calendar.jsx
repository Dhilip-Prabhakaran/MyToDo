import { useEffect, useState } from "react";
import { api } from "../api.js";
import {
  todayStr,
  dayStats,
  sortMilestones,
  fmtDate,
  addDays,
  taskDateLabel,
} from "../insights.js";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const dateKey = (d) => d.toLocaleDateString("en-CA");

// 6 rows x 7 cols starting Monday, padded with prev/next month days.
function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - mondayOffset + i);
    cells.push({ date: dateKey(d), day: d.getDate(), outside: d.getMonth() !== month });
  }
  return cells;
}

function rangeDays(lo, hi, cap = 180) {
  const days = [];
  for (let d = lo; d <= hi && days.length < cap; d = addDays(d, 1)) days.push(d);
  return days;
}

// Below the calendar: the form that adds a task to the current selection.
function AddTaskForm({ lo, hi, data, refresh }) {
  const single = lo === hi;
  const dayCount = rangeDays(lo, hi).length;
  const [form, setForm] = useState({ milestoneId: "", title: "", mode: "single" });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.milestoneId) return;
    await api.addSubtask(form.milestoneId, {
      title: form.title,
      date: lo,
      ...(single ? {} : { endDate: hi, mode: form.mode }),
    });
    setForm((f) => ({ ...f, title: "" }));
    refresh();
  };

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h3>Add a task</h3>
          <p className="card-sub">
            {single ? `On ${fmtDate(lo)}` : `${fmtDate(lo)} → ${fmtDate(hi)} · ${dayCount} days`}
          </p>
        </div>
      </div>

      {data.milestones.length === 0 ? (
        <p className="hint">Create a target with a milestone first to add tasks.</p>
      ) : (
        <form className="add-task-form" onSubmit={submit}>
          <div className="add-task-row">
            <select
              value={form.milestoneId}
              onChange={(e) => setForm({ ...form, milestoneId: e.target.value })}
              required
            >
              <option value="">Milestone…</option>
              {data.targets.map((t) => (
                <optgroup key={t.id} label={t.title}>
                  {sortMilestones(data.milestones)
                    .filter((m) => m.targetId === t.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <input
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <button type="submit" className="btn">
              {single
                ? "Add task"
                : form.mode === "single"
                  ? "Add spanning task"
                  : `Add to ${dayCount} days`}
            </button>
          </div>
          {!single && (
            <div className="mode-picker mode-picker-inline">
              <label>
                <input
                  type="radio"
                  name="range-mode"
                  checked={form.mode === "single"}
                  onChange={() => setForm({ ...form, mode: "single" })}
                />
                One task spanning {dayCount} days
              </label>
              <label>
                <input
                  type="radio"
                  name="range-mode"
                  checked={form.mode === "daily"}
                  onChange={() => setForm({ ...form, mode: "daily" })}
                />
                Repeat daily ({dayCount} separate tasks)
              </label>
            </div>
          )}
        </form>
      )}
    </section>
  );
}

// Right column: read-only list of tasks in the current selection.
function SelectionTasks({ lo, hi, data, refresh }) {
  const days = rangeDays(lo, hi);
  const single = lo === hi;
  const milestoneById = Object.fromEntries(data.milestones.map((m) => [m.id, m]));

  // Unique tasks across the range (a spanning task counts once).
  const seen = new Set();
  const allTasks = days
    .flatMap((d) => dayStats(data.subtasks, d).tasks)
    .filter((t) => !seen.has(t.id) && seen.add(t.id));
  const doneCount = allTasks.filter((t) => t.done).length;

  return (
    <section className="card day-panel">
      <h3>{single ? fmtDate(lo) : `${fmtDate(lo)} → ${fmtDate(hi)} (${days.length} days)`}</h3>
      <p className="hint">
        {allTasks.length === 0
          ? "No tasks in this selection yet — add one below the calendar."
          : `${doneCount}/${allTasks.length} done`}
      </p>

      {days.map((d) => {
        // Each task renders once, under its first day within the selection.
        const tasks = dayStats(data.subtasks, d).tasks.filter(
          (t) => (t.date > lo ? t.date : lo) === d
        );
        if (tasks.length === 0) return null;
        return (
          <div key={d}>
            {!single && <p className="range-day-head">{fmtDate(d)}</p>}
            <ul className="task-list">
              {tasks.map((task) => {
                const milestone = milestoneById[task.milestoneId];
                return (
                  <li key={task.id} className={task.done ? "done" : ""}>
                    <label>
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={async () => {
                          await api.updateSubtask(task.id, { done: !task.done });
                          refresh();
                        }}
                      />
                      <span className="task-title">{task.title}</span>
                    </label>
                    {task.endDate && <span className="task-date">{taskDateLabel(task)}</span>}
                    {milestone && <span className="task-milestone">{milestone.title}</span>}
                    <button
                      className="btn-icon"
                      title="Delete task"
                      onClick={async () => {
                        await api.deleteSubtask(task.id);
                        refresh();
                      }}
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

export default function Calendar({ data, refresh, viewDate, onViewChange }) {
  const today = todayStr();
  const [sel, setSel] = useState({ start: today, end: today });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const up = () => setDragging(false);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const lo = sel.start <= sel.end ? sel.start : sel.end;
  const hi = sel.start <= sel.end ? sel.end : sel.start;

  const cells = buildGrid(viewDate.year, viewDate.month);
  const milestoneById = Object.fromEntries(data.milestones.map((m) => [m.id, m]));
  const targetById = Object.fromEntries(data.targets.map((t) => [t.id, t]));

  const move = (delta) => {
    const d = new Date(viewDate.year, viewDate.month + delta, 1);
    onViewChange({ year: d.getFullYear(), month: d.getMonth() });
  };

  const goToday = () => {
    const t = new Date(today + "T00:00:00");
    onViewChange({ year: t.getFullYear(), month: t.getMonth() });
    setSel({ start: today, end: today });
  };

  return (
    <div className="calendar-layout">
      <div className="cal-main">
        <section className="card">
          <div className="cal-toolbar">
            <h2>
              {MONTHS[viewDate.month]} {viewDate.year}
            </h2>
            <div className="cal-nav">
              <button className="nav-btn" title="Previous month" onClick={() => move(-1)}>
                ‹
              </button>
              <button className="nav-btn nav-today" onClick={goToday}>
                Today
              </button>
              <button className="nav-btn" title="Next month" onClick={() => move(1)}>
                ›
              </button>
            </div>
          </div>
          <div className={`cal-grid ${dragging ? "dragging" : ""}`}>
            {DOW.map((d) => (
              <div key={d} className="cal-dow">
                {d}
              </div>
            ))}
            {cells.map((cell) => {
              const stats = dayStats(data.subtasks, cell.date);
              const missed = cell.date < today && stats.total > 0 && stats.done < stats.total;
              const inRange = cell.date >= lo && cell.date <= hi;
              const targetColors = [
                ...new Set(
                  stats.tasks
                    .map((t) => targetById[milestoneById[t.milestoneId]?.targetId]?.color)
                    .filter(Boolean)
                ),
              ].slice(0, 4);
              return (
                <button
                  key={cell.date}
                  className={[
                    "cal-cell",
                    cell.outside ? "outside" : "",
                    cell.date === today ? "today" : "",
                    inRange ? "in-range" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSel({ start: cell.date, end: cell.date });
                    setDragging(true);
                  }}
                  onMouseEnter={() => {
                    if (dragging) setSel((s) => ({ ...s, end: cell.date }));
                  }}
                >
                  <span className="cal-daynum">{cell.day}</span>
                  {stats.total > 0 && (
                    <span
                      className={`cal-count ${
                        stats.done === stats.total ? "all-done" : missed ? "missed" : ""
                      }`}
                    >
                      {stats.done}/{stats.total}
                    </span>
                  )}
                  <span className="cal-dots">
                    {targetColors.map((c) => (
                      <span key={c} className="cal-dot" style={{ background: c }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <AddTaskForm lo={lo} hi={hi} data={data} refresh={refresh} />
      </div>

      <SelectionTasks lo={lo} hi={hi} data={data} refresh={refresh} />
    </div>
  );
}
