import { useEffect, useState } from "react";
import { api } from "../api.js";
import {
  todayStr,
  dayStats,
  streak,
  fmtDate,
  addDays,
  lastNDays,
  targetStats,
  taskDateLabel,
} from "../insights.js";
import ProgressRing from "./ProgressRing.jsx";
import PlannedTable from "./PlannedTable.jsx";
import Calendar from "./Calendar.jsx";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// Tear-off desk-calendar sheet that flips in when the date changes.
function DateSheet({ dateStr }) {
  const d = new Date(dateStr + "T00:00:00");
  return (
    <div className="date-sheet" key={dateStr}>
      <div className="date-sheet-top">{WEEKDAYS[d.getDay()]}</div>
      <div className="date-sheet-body">
        <span className="date-sheet-day">{d.getDate()}</span>
        <span className="date-sheet-month">{MONTHS[d.getMonth()]}</span>
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
          <div>
            <h3>Plan tasks</h3>
            <p className="card-sub">
              Click a day or drag across days, then add a task to the selection.
            </p>
          </div>
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
  const today = todayStr();
  const stats = dayStats(data.subtasks, today);
  const currentStreak = streak(data.subtasks);
  const tomorrow = dayStats(data.subtasks, addDays(today, 1));
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

  const toggle = async (task) => {
    await api.updateSubtask(task.id, { done: !task.done });
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
                </li>
              ))}
            </ul>
          </section>
        ))}

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

        <PlannedTable data={data} refresh={refresh} />
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
            <h3>Target completion</h3>
          </div>
          <div className="ring-row">
            {data.targets.map((t) => {
              const tStats = targetStats(t, data.milestones, data.subtasks);
              return (
                <div key={t.id} className="ring-item">
                  <ProgressRing value={tStats.completion} color={t.color} size={100} />
                  <span className="ring-caption">{t.title}</span>
                  <span className="ring-sub">
                    {tStats.daysLeft >= 0 ? `${tStats.daysLeft}d left` : "past due"}
                  </span>
                </div>
              );
            })}
            {data.targets.length === 0 && <p className="hint">No targets yet.</p>}
          </div>
        </section>
      </div>

      {planOpen && <PlanModal data={data} refresh={refresh} onClose={() => setPlanOpen(false)} />}
    </div>
  );
}
