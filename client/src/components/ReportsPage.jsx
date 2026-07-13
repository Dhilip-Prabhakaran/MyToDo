import { useEffect, useState } from "react";
import {
  todayStr,
  addDays,
  fmtDate,
  dueStats,
  streak,
  lastNDays,
  dayOf,
  targetStats,
  habitStreak,
  habitLastNDays,
} from "../insights.js";

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Ease-out count-up for stat tiles — the number rolls to its value on mount.
// rAF is throttled (or never fires) in hidden/background tabs, so a timeout
// fallback guarantees the tile always lands on the real value.
function useCountUp(target, ms = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (document.hidden) {
      setVal(target);
      return;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / ms, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const safety = setTimeout(() => setVal(target), ms + 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
    };
  }, [target, ms]);
  return val;
}

function StatTile({ value, suffix = "", label, cls }) {
  const v = useCountUp(value);
  return (
    <div className="stat">
      <span className={`stat-num ${cls}`}>
        {v}
        {suffix}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// Completion % per Monday-aligned week (due-date semantics), oldest first.
function weeklyTrend(subtasks, weeks = 12) {
  const today = todayStr();
  const mondayOffset = (new Date(today + "T00:00:00").getDay() + 6) % 7;
  const thisMonday = addDays(today, -mondayOffset);
  const out = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const start = addDays(thisMonday, -w * 7);
    let total = 0;
    let done = 0;
    for (let i = 0; i < 7; i++) {
      const s = dueStats(subtasks, addDays(start, i));
      total += s.total;
      done += s.done;
    }
    out.push({ start, total, done, pct: total ? Math.round((done / total) * 100) : 0 });
  }
  return out;
}

// SVG area chart with a draw-in line animation (pathLength trick).
function TrendChart({ data }) {
  const W = 560;
  const H = 150;
  const P = 10;
  const step = (W - 2 * P) / Math.max(data.length - 1, 1);
  const pts = data.map((d, i) => [P + i * step, H - P - (d.pct / 100) * (H - 2 * P)]);
  const line = pts.map((p) => p.map((n) => Math.round(n * 10) / 10).join(",")).join(" ");
  const area = `${P},${H - P} ${line} ${P + (data.length - 1) * step},${H - P}`;

  return (
    <div className="rp-trend-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="rp-trend" preserveAspectRatio="none">
        {[25, 50, 75].map((g) => {
          const y = H - P - (g / 100) * (H - 2 * P);
          return <line key={g} x1={P} y1={y} x2={W - P} y2={y} className="rp-gridline" />;
        })}
        <polygon points={area} className="rp-trend-area" />
        <polyline points={line} pathLength="1" className="rp-trend-line" fill="none" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" className="rp-trend-dot" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
            <title>{`wk of ${fmtDate(data[i].start)}: ${data[i].done}/${data[i].total} (${data[i].pct}%)`}</title>
          </circle>
        ))}
      </svg>
      <div className="rp-trend-labels">
        <span>{fmtDate(data[0].start)}</span>
        <span>{fmtDate(data[data.length - 1].start)} (this wk)</span>
      </div>
    </div>
  );
}

// Vertical bars with a grow-up animation; values scaled to the max.
// Each item may carry its own colour; the leader gets the gold treatment.
function BarChart({ items, color = "var(--accent)" }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="bar-chart rp-bars">
      {items.map((it, i) => (
        <div key={it.label + i} className="bar-col" title={`${it.title ?? it.label}: ${it.value}`}>
          <div className="bar-track">
            <div
              className={`bar-fill rp-grow ${it.top ? "bar-perfect" : ""}`}
              style={{
                height: `${Math.max((it.value / max) * 100, it.value > 0 ? 5 : 0)}%`,
                background: it.top ? undefined : it.color || color,
                animationDelay: `${i * 0.04}s`,
              }}
            />
          </div>
          <span className="bar-label">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// One colour per weekday (the wordmark palette, plus terracotta for Sunday).
const WD_COLORS = ["#0078D4", "#E81B23", "#107C10", "#D97706", "#7D3C98", "#00A4EF", "#d97757"];

// Horizontal progress bar that sweeps in from the left.
function SweepBar({ pct: p, color, delay = 0 }) {
  return (
    <span className="mini-bar rp-sweep-track">
      <span
        className="mini-bar-fill rp-sweep"
        style={{ width: `${p}%`, background: color, animationDelay: `${delay}s` }}
      />
    </span>
  );
}

export default function ReportsPage({ data }) {
  const today = todayStr();
  const doneTasks = data.subtasks.filter((s) => s.done);

  // ---- tiles ----
  const currentStreak = streak(data.subtasks);
  const last30 = lastNDays(data.subtasks, 30);
  const active30 = last30.filter((d) => d.total > 0);
  const avg30 = active30.length
    ? Math.round(active30.reduce((s, d) => s + d.pct, 0) / active30.length)
    : 0;
  const perfect30 = active30.filter((d) => d.done === d.total).length;

  // ---- which weekdays get things finished (uses doneAt's app-day) ----
  const weekdayCounts = WD.map(() => 0);
  for (const t of doneTasks) {
    if (!t.doneAt) continue;
    const day = dayOf(t.doneAt);
    if (day) weekdayCounts[(new Date(day + "T00:00:00").getDay() + 6) % 7]++;
  }
  const bestWd = weekdayCounts.indexOf(Math.max(...weekdayCounts));

  const weekdayItems = WD.map((label, i) => ({
    label,
    value: weekdayCounts[i],
    color: WD_COLORS[i],
    top: i === bestWd && weekdayCounts[i] > 0,
  }));

  const trend = weeklyTrend(data.subtasks);
  const hasAnyDue = trend.some((w) => w.total > 0);

  return (
    <div className="reports-page">
      <section className="card stat-row rp-card">
        <StatTile value={doneTasks.length} label="tasks completed" cls="c2" />
        <StatTile value={currentStreak} label="day streak" cls="c1" />
        <StatTile value={avg30} suffix="%" label="avg daily (30d)" cls="c3" />
        <StatTile value={perfect30} label="perfect days (30d)" cls="c4" />
      </section>

      <div className="rp-grid">
        <section className="card rp-card">
          <div className="card-head">
            <h3>Completion trend</h3>
            <p className="card-sub">% of due tasks completed, per week — last 12 weeks.</p>
          </div>
          {hasAnyDue ? (
            <TrendChart data={trend} />
          ) : (
            <p className="hint">No scheduled tasks in the last 12 weeks yet.</p>
          )}
        </section>

        <section className="card rp-card">
          <div className="card-head">
            <h3>Productive weekdays</h3>
            <p className="card-sub">
              Completions by day{weekdayCounts[bestWd] > 0 ? ` — ${WD[bestWd]} leads` : ""}.
            </p>
          </div>
          {doneTasks.length ? (
            <BarChart items={weekdayItems} />
          ) : (
            <p className="hint">Complete a few tasks to see your pattern.</p>
          )}
        </section>
      </div>

      <div className="rp-grid">
        <section className="card rp-card">
          <div className="card-head">
            <h3>Target progress</h3>
          </div>
          {data.targets.length === 0 ? (
            <p className="hint">No targets yet.</p>
          ) : (
            <ul className="rp-list">
              {data.targets.map((t, i) => {
                const s = targetStats(t, data.milestones, data.subtasks);
                return (
                  <li key={t.id}>
                    <span className="cal-dot" style={{ background: t.color }} />
                    <span className="rp-list-title">{t.title}</span>
                    <SweepBar pct={s.completion} color={t.color} delay={i * 0.12} />
                    <span className="rp-list-num" style={{ color: t.color }}>
                      {s.completion}%
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card rp-card">
          <div className="card-head">
            <h3>Habit consistency (30d)</h3>
          </div>
          {(data.habits || []).length === 0 ? (
            <p className="hint">No habits yet — add some on the Habits page.</p>
          ) : (
            <ul className="rp-list">
              {data.habits.map((h, i) => {
                const hits = habitLastNDays(h, data.habitLogs, 30).filter((d) => d.done).length;
                const expected =
                  h.frequency === "weekly" ? Math.round((h.timesPerWeek * 30) / 7) : 30;
                const p = Math.min(Math.round((hits / expected) * 100), 100);
                return (
                  <li key={h.id}>
                    <span className="cal-dot" style={{ background: h.color }} />
                    <span className="rp-list-title">{h.title}</span>
                    <SweepBar pct={p} color={h.color} delay={i * 0.12} />
                    <span className="rp-list-num" style={{ color: h.color }}>
                      {p}%
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
