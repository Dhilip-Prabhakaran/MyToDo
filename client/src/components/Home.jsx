import { useEffect, useState } from "react";
import { api } from "../api.js";
import {
  todayStr,
  dueStats,
  streak,
  fmtDate,
  addDays,
  daysBetween,
  lastNDays,
  targetStats,
  overdueTasks,
  inProgressSpanning,
  taskDateLabel,
} from "../insights.js";
import ProgressRing from "./ProgressRing.jsx";
import Calendar from "./Calendar.jsx";
import TaskEditModal from "./TaskEditModal.jsx";
import HabitQuickList from "./HabitQuickList.jsx";

// A pinned "today's focus" task is the one thing that matters most that day —
// capped low on purpose, otherwise everything ends up pinned and nothing does.
const FOCUS_LIMIT = 3;

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// Six full palettes (top strip, card body, text) built around the MyToDo
// wordmark colors — a light tint of each hue behind matching dark text, so
// the whole card reads as one coherent combination. Cycled one-per-day.
const DAY_PALETTES = [
  { top: "#0078D4", bg: "#DBEAFE", text: "#1E3A8A", border: "#93C5FD" }, // blue
  { top: "#E81B23", bg: "#FEE2E2", text: "#7F1D1D", border: "#FCA5A5" }, // red
  { top: "#107C10", bg: "#DCFCE7", text: "#14532D", border: "#86EFAC" }, // green
  { top: "#D97706", bg: "#FEF3C7", text: "#78350F", border: "#FCD34D" }, // amber
  { top: "#7D3C98", bg: "#F3E8FF", text: "#581C87", border: "#D8B4FE" }, // purple
  { top: "#00A4EF", bg: "#CFFAFE", text: "#164E63", border: "#67E8F9" }, // cyan
];

// Tear-off desk-calendar sheet that flips in when the date changes.
function DateSheet({ dateStr }) {
  const d = new Date(dateStr + "T00:00:00");
  const palette = DAY_PALETTES[Math.floor(d.getTime() / 86400000) % DAY_PALETTES.length];
  return (
    <div
      className="date-sheet"
      key={dateStr}
      style={{ background: palette.bg, borderColor: palette.border }}
    >
      <div className="date-sheet-top" style={{ background: palette.top }}>
        {WEEKDAYS[d.getDay()]}
      </div>
      <div className="date-sheet-body">
        <span className="date-sheet-day" style={{ color: palette.text }}>
          {d.getDate()}
        </span>
        <span className="date-sheet-month" style={{ color: palette.text }}>
          {MONTHS[d.getMonth()]}
        </span>
      </div>
      <span className="date-sheet-ring date-sheet-ring-l" />
      <span className="date-sheet-ring date-sheet-ring-r" />
    </div>
  );
}

function PlanModal({ data, refresh, onClose }) {
  const [viewDate, setViewDate] = useState(() => {
    const t = new Date(todayStr() + "T00:00:00");
    return { year: t.getFullYear(), month: t.getMonth() };
  });

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-label="Plan tasks">
        <div className="modal-head">
          <h3>Plan tasks</h3>
          <button className="btn-icon" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        <Calendar data={data} refresh={refresh} viewDate={viewDate} onViewChange={setViewDate} />
      </div>
    </div>
  );
}

export default function Home({ data, refresh }) {
  const [planOpen, setPlanOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const today = todayStr();
  const stats = dueStats(data.subtasks, today);
  const currentStreak = streak(data.subtasks);
  const tomorrow = dueStats(data.subtasks, addDays(today, 1));
  const days = lastNDays(data.subtasks, 14);
  const totalDone = data.subtasks.filter((s) => s.done).length;
  const activeDays = days.filter((d) => d.total > 0);
  const avgPct =
    activeDays.length === 0
      ? 0
      : Math.round(activeDays.reduce((sum, d) => sum + d.pct, 0) / activeDays.length);

  const milestoneById = Object.fromEntries(data.milestones.map((m) => [m.id, m]));
  const targetById = Object.fromEntries(data.targets.map((t) => [t.id, t]));

  // Group today's tasks by target so the list reads by goal.
  const groups = {};
  for (const task of stats.tasks) {
    const milestone = milestoneById[task.milestoneId];
    const target = milestone ? targetById[milestone.targetId] : null;
    const key = target ? target.id : "other";
    groups[key] ??= { target, milestoneTasks: [] };
    groups[key].milestoneTasks.push({ task, milestone });
  }

  const withContext = (task) => {
    const milestone = milestoneById[task.milestoneId];
    return { task, milestone, target: milestone ? targetById[milestone.targetId] : null };
  };

  // Only genuinely late work needs attention: tasks past their own due date and
  // still unfinished. A spanning task inside its window is NOT late, so it never
  // lands here — it shows in the "In progress" section instead.
  const overdue = overdueTasks(data.subtasks).map(withContext);

  // Multi-day tasks currently underway (started, not yet at their due day).
  const spanningNow = inProgressSpanning(data.subtasks).map(withContext);

  // Pinned "today's focus" tasks (starred), shown at the top regardless of target.
  const focusTasks = stats.tasks
    .filter((t) => t.priority)
    .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
  const pinnedOpenCount = stats.tasks.filter((t) => t.priority && !t.done).length;

  const toggle = async (task) => {
    await api.updateSubtask(task.id, { done: !task.done });
    refresh();
  };

  const togglePriority = async (task) => {
    if (!task.priority && pinnedOpenCount >= FOCUS_LIMIT) {
      alert(`You can only pin up to ${FOCUS_LIMIT} tasks as today's focus at a time.`);
      return;
    }
    await api.updateSubtask(task.id, { priority: !task.priority });
    refresh();
  };

  return (
    <div className="dash-cols">
      {/* ---------- left: today ---------- */}
      <div className="dash-main">
        <section className="hero card">
          <div className="hero-left">
            <DateSheet dateStr={today} />
            <div className="hero-text">
              <p className="eyebrow">Day runs 06:00 – 05:59</p>
              <h2>
                {stats.total === 0 ? (
                  "Nothing scheduled today"
                ) : (
                  <>
                    <span className="hero-count done">{stats.done}</span>
                    <span className="hero-of"> of </span>
                    <span className="hero-count total">{stats.total}</span>
                    <span className="hero-of"> tasks done</span>
                  </>
                )}
              </h2>
              <div className="stat-chips">
                <span className="chip">
                  Streak <strong>{currentStreak} {currentStreak === 1 ? "day" : "days"}</strong>
                </span>
                <span className="chip">
                  Targets <strong>{data.targets.length}</strong>
                </span>
                <span className="chip">
                  Tomorrow <strong>{tomorrow.total} {tomorrow.total === 1 ? "task" : "tasks"}</strong>
                </span>
              </div>
              {stats.total > 0 && stats.done === stats.total && (
                <div className="celebrate">✓ All done for today</div>
              )}
            </div>
          </div>
          <div className="hero-right">
            <ProgressRing value={stats.pct} label="today" />
            <button className="btn" onClick={() => setPlanOpen(true)}>
              ＋ Plan tasks
            </button>
          </div>
        </section>

        {overdue.length > 0 && (
          <section className="card pace-alert">
            <div className="card-head">
              <h3>⚠ Needs attention</h3>
            </div>
            <ul className="task-list">
              {overdue.map(({ task, milestone, target }) => (
                <li key={task.id} className={task.done ? "done" : ""}>
                  <label>
                    <input type="checkbox" checked={task.done} onChange={() => toggle(task)} />
                    <span className="cal-dot" style={{ background: target?.color || "#9b968a" }} />
                    <span className="task-title">{task.title}</span>
                  </label>
                  {milestone && <span className="task-milestone">{milestone.title}</span>}
                  <span className="chip chip-red">
                    {daysBetween(task.endDate || task.date, today)}d overdue
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {focusTasks.length > 0 && (
          <section className="card focus-card">
            <div className="card-head">
              <h3>⭐ Today's focus</h3>
            </div>
            <ul className="task-list">
              {focusTasks.map((task) => {
                const milestone = milestoneById[task.milestoneId];
                return (
                  <li key={task.id} className={task.done ? "done" : ""}>
                    <label>
                      <input type="checkbox" checked={task.done} onChange={() => toggle(task)} />
                      <span className="task-title">{task.title}</span>
                    </label>
                    {milestone && <span className="task-milestone">{milestone.title}</span>}
                    <button
                      className="btn-icon star-btn active"
                      title="Unpin from today's focus"
                      onClick={() => togglePriority(task)}
                    >
                      ★
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {Object.values(groups).map(({ target, milestoneTasks }) => (
          <section
            key={target ? target.id : "other"}
            className="card task-group"
            style={{ borderLeft: `3px solid ${target?.color || "#9b968a"}` }}
          >
            <h3 style={{ color: target?.color }}>{target ? target.title : "Other"}</h3>
            <ul className="task-list">
              {milestoneTasks.map(({ task, milestone }) => (
                <li key={task.id} className={task.done ? "done" : ""}>
                  <label>
                    <input type="checkbox" checked={task.done} onChange={() => toggle(task)} />
                    <span className="task-title">{task.title}</span>
                  </label>
                  {task.endDate && <span className="task-date">{taskDateLabel(task)}</span>}
                  {milestone && <span className="task-milestone">{milestone.title}</span>}
                  <button
                    className={`btn-icon star-btn ${task.priority ? "active" : ""}`}
                    title={task.priority ? "Unpin from today's focus" : "Pin as today's focus"}
                    onClick={() => togglePriority(task)}
                  >
                    ★
                  </button>
                  <button
                    className="btn-icon"
                    title="Edit task"
                    onClick={() => setEditingTask(task)}
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {spanningNow.length > 0 && (
          <section className="card inprogress-card">
            <div className="card-head">
              <h3>🕒 In progress</h3>
              <p className="card-sub">Multi-day tasks underway — due on their last day.</p>
            </div>
            <ul className="task-list">
              {spanningNow.map(({ task, milestone, target }) => (
                <li key={task.id} className={task.done ? "done" : ""}>
                  <label>
                    <input type="checkbox" checked={task.done} onChange={() => toggle(task)} />
                    <span className="cal-dot" style={{ background: target?.color || "#9b968a" }} />
                    <span className="task-title">{task.title}</span>
                  </label>
                  <span className="task-date">{taskDateLabel(task)}</span>
                  {milestone && <span className="task-milestone">{milestone.title}</span>}
                  <button
                    className="btn-icon"
                    title="Edit task"
                    onClick={() => setEditingTask(task)}
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.targets.length === 0 && (
          <section className="card empty-state">
            <h3>Welcome to MyToDo</h3>
            <p>
              Start by creating a <strong>Target</strong> (your big goal — e.g. "Master Gen AI in 9
              months"), break it into <strong>Milestones</strong> on the Targets page, then plan
              small <strong>daily subtasks</strong> with the Plan tasks button.
            </p>
          </section>
        )}
      </div>

      {/* ---------- right: insights ---------- */}
      <div className="dash-side">
        <section className="card stat-row">
          <div className="stat">
            <span className="stat-num c1">{currentStreak}</span>
            <span className="stat-label">day streak</span>
          </div>
          <div className="stat">
            <span className="stat-num c2">{totalDone}</span>
            <span className="stat-label">tasks completed</span>
          </div>
          <div className="stat">
            <span className="stat-num c3">{avgPct}%</span>
            <span className="stat-label">avg daily (14d)</span>
          </div>
        </section>

        <HabitQuickList data={data} refresh={refresh} />

        <section className="card">
          <div className="card-head">
            <h3>Last 14 days</h3>
          </div>
          <div className="bar-chart">
            {days.map((d) => (
              <div
                key={d.date}
                className="bar-col"
                title={`${fmtDate(d.date)}: ${d.done}/${d.total} (${d.pct}%)`}
              >
                <div className="bar-track">
                  <div
                    className={`bar-fill ${d.pct === 100 && d.total > 0 ? "bar-perfect" : ""}`}
                    style={{ height: `${d.total === 0 ? 0 : Math.max(d.pct, 4)}%` }}
                  />
                </div>
                <span className={`bar-label ${d.date === today ? "today" : ""}`}>
                  {fmtDate(d.date).split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
          <p className="hint">Bar height = % of that day's tasks completed. Gold = perfect day.</p>
        </section>

        <section className="card">
          <div className="card-head">
            <h3>Targets</h3>
          </div>
          {data.targets.length === 0 ? (
            <p className="hint">No targets yet.</p>
          ) : (
            <ul className="pace-list">
              {data.targets
                .map((t) => ({ target: t, stats: targetStats(t, data.milestones, data.subtasks) }))
                .sort((a, b) => a.stats.daysLeft - b.stats.daysLeft)
                .map(({ target, stats: tStats }) => (
                  <li key={target.id}>
                    <span className="cal-dot" style={{ background: target.color }} />
                    <span className="pace-title">{target.title}</span>
                    <span className="habit-streak" style={{ color: target.color }}>
                      {tStats.daysLeft >= 0 ? `${tStats.daysLeft}d left` : "past due"}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      {planOpen && <PlanModal data={data} refresh={refresh} onClose={() => setPlanOpen(false)} />}
      {editingTask && (
        <TaskEditModal task={editingTask} onClose={() => setEditingTask(null)} refresh={refresh} />
      )}
    </div>
  );
}
