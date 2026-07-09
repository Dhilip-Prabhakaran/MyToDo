import Habits from "./Habits.jsx";
import { fmtDate, habitStreak, habitLastNWeeks, habitLastNDays } from "../insights.js";

function HabitReport({ habit, habitLogs }) {
  const weeks = habitLastNWeeks(habit, habitLogs, 8);
  const days = habitLastNDays(habit, habitLogs, 30);
  const hits30 = days.filter((d) => d.done).length;
  const isWeekly = habit.frequency === "weekly";
  const streakCount = habitStreak(habit, habitLogs);

  return (
    <div className="habit-report">
      <div className="habit-report-head">
        <span className="cal-dot" style={{ background: habit.color }} />
        <h4>{habit.title}</h4>
        <span className="habit-streak" style={{ color: habit.color }}>
          {isWeekly ? `🔥 ${streakCount} wk` : `🔥 ${streakCount}d`}
        </span>
      </div>

      <div className="bar-chart small">
        {weeks.map((w) => (
          <div
            key={w.end}
            className="bar-col"
            title={`${fmtDate(w.start)}–${fmtDate(w.end)}: ${w.hits}/${w.target}`}
          >
            <div className="bar-track">
              <div
                className={`bar-fill ${w.pct >= 100 ? "bar-perfect" : ""}`}
                style={{ height: `${Math.max(w.pct, 4)}%`, background: habit.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="habit-heatmap">
        {days.map((d) => (
          <span
            key={d.date}
            className="heatmap-dot"
            style={d.done ? { background: habit.color } : undefined}
            title={`${fmtDate(d.date)} — ${d.done ? "done" : "not done"}`}
          />
        ))}
      </div>
      <p className="hint">{hits30}/30 days done in the last month</p>
    </div>
  );
}

export default function HabitsPage({ data, refresh }) {
  const habits = data.habits || [];
  const habitLogs = data.habitLogs || [];

  return (
    <div className="habits-page">
      <Habits data={data} refresh={refresh} />

      {habits.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h3>Habit reports</h3>
            <p className="card-sub">Weekly hit-rate (last 8 weeks) and a 30-day history per habit.</p>
          </div>
          {habits.map((h) => (
            <HabitReport key={h.id} habit={h} habitLogs={habitLogs} />
          ))}
        </section>
      )}
    </div>
  );
}
