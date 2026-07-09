import { api } from "../api.js";
import { todayStr, isHabitDoneOn, habitStreak, habitWeekProgress } from "../insights.js";

// Compact daily check-in for the Home sidebar — just tick today's box.
// Adding/editing/deleting habits and the visual reports live on the Habits page.
export default function HabitQuickList({ data, refresh }) {
  const habits = data.habits || [];
  const habitLogs = data.habitLogs || [];
  const today = todayStr();

  return (
    <section className="card">
      <div className="card-head">
        <h3>Health habits</h3>
      </div>
      {habits.length === 0 ? (
        <p className="hint">No habits yet — add one on the Habits page.</p>
      ) : (
        <ul className="task-list">
          {habits.map((h) => {
            const done = isHabitDoneOn(h, habitLogs, today);
            const isWeekly = h.frequency === "weekly";
            const weekProgress = isWeekly ? habitWeekProgress(h, habitLogs) : null;
            const badge = isWeekly
              ? `${weekProgress.hits}/${weekProgress.target} wk`
              : `🔥 ${habitStreak(h, habitLogs)}d`;
            return (
              <li key={h.id} className={done ? "done" : ""}>
                <label>
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={async () => {
                      await api.logHabit(h.id, today, !done);
                      refresh();
                    }}
                  />
                  <span className="cal-dot" style={{ background: h.color }} />
                  <span className="task-title">{h.title}</span>
                </label>
                <span className="habit-streak" style={{ color: h.color }}>
                  {badge}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
