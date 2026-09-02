import { api } from "../api.js";
import { todayStr, todayScore, habitPointsOn } from "../insights.js";

const LEVELS = [0, 25, 50, 75, 100];

// Compact daily check-in for the Home sidebar, with today's health score on top.
// Full config + history live on the Habits page.
export default function HabitQuickList({ data, refresh }) {
  const habits = data.habits || [];
  const habitLogs = data.habitLogs || [];
  const today = todayStr();
  const { earned, max } = todayScore(habits, habitLogs);

  const write = async (habitId, opts) => {
    await api.logHabit(habitId, today, opts);
    refresh();
  };

  return (
    <section className="card">
      <div className="card-head">
        <h3>Health habits</h3>
        {habits.length > 0 && (
          <span className="habit-score-pill">
            {earned}<span> / {max}</span>
          </span>
        )}
      </div>
      {habits.length === 0 ? (
        <p className="hint">No habits yet — add one on the Habits page.</p>
      ) : (
        <ul className="task-list">
          {habits.map((h) => {
            const points = h.points ?? 10;
            const graded = h.scoreType === "graded";
            const log = habitLogs.find((l) => l.habitId === h.id && l.date === today);
            const value = log ? (log.value ?? (log.done ? 100 : 0)) : 0;
            const isRest = !!log?.rest;
            const earnedH = habitPointsOn(h, habitLogs, today);
            return (
              <li key={h.id} className={value > 0 ? "done" : ""}>
                {graded ? (
                  <span className="ql-graded">
                    <span className="cal-dot" style={{ background: h.color }} />
                    <span className="task-title">{h.title}</span>
                    <select
                      className="ql-level"
                      value={isRest ? 100 : value}
                      onChange={(e) => write(h.id, { value: +e.target.value })}
                    >
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}%
                        </option>
                      ))}
                    </select>
                  </span>
                ) : (
                  <label>
                    <input
                      type="checkbox"
                      checked={value > 0}
                      onChange={() => write(h.id, { value: value > 0 ? 0 : 100 })}
                    />
                    <span className="cal-dot" style={{ background: h.color }} />
                    <span className="task-title">{h.title}</span>
                  </label>
                )}
                <span className="habit-streak" style={{ color: h.color }}>
                  {earnedH}/{points}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
