import { useState } from "react";
import {
  todayStr,
  addDays,
  fmtDate,
  dayScore,
  lastNDaysScore,
  habitValueOn,
  habitStats,
  habitTrend,
  habitStreak,
} from "../insights.js";

const RANGES = [30, 60, 90];

// ---------- tiny inline charts (no dependency) ----------
function AreaChart({ series }) {
  const W = 600;
  const H = 150;
  const P = 8;
  const step = (W - 2 * P) / Math.max(series.length - 1, 1);
  const pts = series.map((d, i) => [P + i * step, H - P - (d.pct / 100) * (H - 2 * P)]);
  const line = pts.map((p) => p.map((n) => Math.round(n * 10) / 10).join(",")).join(" ");
  const area = `${P},${H - P} ${line} ${P + (series.length - 1) * step},${H - P}`;
  return (
    <div className="hr-chartwrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="hr-chart" preserveAspectRatio="none">
        {[25, 50, 75].map((g) => {
          const y = H - P - (g / 100) * (H - 2 * P);
          return <line key={g} x1={P} y1={y} x2={W - P} y2={y} className="hr-grid" />;
        })}
        <polygon points={area} className="hr-area" />
        <polyline points={line} className="hr-line" fill="none" />
      </svg>
      <div className="hr-chart-x">
        <span>{fmtDate(series[0].date)}</span>
        <span>{fmtDate(series[series.length - 1].date)}</span>
      </div>
    </div>
  );
}

function Sparkline({ days, color }) {
  const W = 100;
  const H = 26;
  const step = W / Math.max(days.length - 1, 1);
  const pts = days.map((d, i) => `${(i * step).toFixed(1)},${(H - 2 - (d.value / 100) * (H - 4)).toFixed(1)}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hr-spark" preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function HabitsReport({ data, onBack }) {
  const habits = data.habits || [];
  const logs = data.habitLogs || [];
  const [range, setRange] = useState(30);
  const today = todayStr();

  const series = lastNDaysScore(habits, logs, range);
  const tracked = series.filter((d) => d.earned > 0);
  const avgScore = tracked.length
    ? Math.round(tracked.reduce((s, d) => s + d.pct, 0) / tracked.length)
    : 0;
  const best = series.reduce((b, d) => (!b || d.earned > b.earned ? d : b), null);
  const perfect = series.filter((d) => d.max > 0 && d.earned === d.max).length;

  const items = habits
    .map((h) => ({
      h,
      stats: habitStats(h, logs, range),
      trend: habitTrend(h, logs, Math.min(range, 28)),
      streak: habitStreak(h, logs),
    }))
    .sort((a, b) => a.stats.rate - b.stats.rate); // weakest first — "what to work on"

  // Insights
  const used = new Set();
  const focus = [];
  items
    .filter((i) => i.trend.delta <= -15)
    .slice(0, 2)
    .forEach((i) => {
      used.add(i.h.id);
      focus.push({
        color: i.h.color,
        text: `${i.h.title} is slipping — ${i.trend.recentRate}% lately vs ${i.trend.prevRate}% before.`,
      });
    });
  items
    .filter((i) => i.stats.rate < 40 && !used.has(i.h.id))
    .slice(0, 3 - focus.length)
    .forEach((i) => {
      used.add(i.h.id);
      focus.push({
        color: i.h.color,
        text: `${i.h.title} is low — ${i.stats.done}/${range} days (${i.stats.rate}%).`,
      });
    });
  const wins = items
    .filter((i) => i.trend.delta >= 15)
    .sort((a, b) => b.trend.delta - a.trend.delta)
    .slice(0, 3)
    .map((i) => ({
      color: i.h.color,
      text: `${i.h.title} up ${i.trend.delta} pts — ${i.trend.recentRate}% lately.`,
    }));

  const exportCsv = () => {
    const dates = series.map((d) => d.date);
    const header = ["Date", ...habits.map((h) => h.title), "Score", "Max"];
    const rows = dates.map((date) => {
      const cols = habits.map((h) => habitValueOn(logs, h.id, date));
      const s = dayScore(habits, logs, date);
      return [date, ...cols, s.earned, s.max];
    });
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mytodo-habits-${range}d-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="habits-report">
      <div className="doc-toolbar">
        <button className="nav-btn nav-today" onClick={onBack}>
          ← Habits
        </button>
        <span className="doc-toolbar-crumb">Habit analytics</span>
        <span className="hr-toolbar-right">
          <span className="hr-range">
            {RANGES.map((r) => (
              <button
                key={r}
                className={`filter-chip ${range === r ? "active" : ""}`}
                onClick={() => setRange(r)}
              >
                {r}d
              </button>
            ))}
          </span>
          <button className="btn-icon" onClick={exportCsv} disabled={habits.length === 0}>
            ⬇ Export CSV
          </button>
        </span>
      </div>

      {habits.length === 0 ? (
        <section className="card empty-state">
          <h3>No habits to analyse yet</h3>
          <p>Add habits and log a few days — trends and insights build up here.</p>
        </section>
      ) : (
        <>
          <section className="card stat-row">
            <div className="stat">
              <span className="stat-num c3">{avgScore}%</span>
              <span className="stat-label">avg score ({range}d)</span>
            </div>
            <div className="stat">
              <span className="stat-num c1">{best ? best.earned : 0}</span>
              <span className="stat-label">best day</span>
            </div>
            <div className="stat">
              <span className="stat-num c2">{tracked.length}</span>
              <span className="stat-label">days tracked</span>
            </div>
            <div className="stat">
              <span className="stat-num c4">{perfect}</span>
              <span className="stat-label">perfect days</span>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h3>Score trend</h3>
              <p className="card-sub">Daily health score over the last {range} days.</p>
            </div>
            <AreaChart series={series} />
          </section>

          <div className="rp-grid">
            <section className="card hr-insight focus">
              <div className="card-head">
                <h3>⚠ What to work on</h3>
              </div>
              {focus.length === 0 ? (
                <p className="hint">Nothing slipping — everything's holding up. 🎯</p>
              ) : (
                <ul className="hr-insight-list">
                  {focus.map((f, i) => (
                    <li key={i}>
                      <span className="cal-dot" style={{ background: f.color }} />
                      {f.text}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card hr-insight wins">
              <div className="card-head">
                <h3>🔥 Improving</h3>
              </div>
              {wins.length === 0 ? (
                <p className="hint">No big jumps this period — steady as she goes.</p>
              ) : (
                <ul className="hr-insight-list">
                  {wins.map((w, i) => (
                    <li key={i}>
                      <span className="cal-dot" style={{ background: w.color }} />
                      {w.text}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="card">
            <div className="card-head">
              <h3>Per-habit breakdown</h3>
              <p className="card-sub">Weakest first. Trend compares the recent half vs the earlier half.</p>
            </div>
            <div className="hr-rows">
              {items.map(({ h, stats, trend, streak }) => {
                const up = trend.delta > 0;
                const flat = trend.delta === 0;
                return (
                  <div key={h.id} className="hr-row">
                    <span className="cal-dot" style={{ background: h.color }} />
                    <span className="hr-name">{h.title}</span>
                    <Sparkline days={stats.days} color={h.color} />
                    <span className="hr-bar">
                      <span
                        className="hr-bar-fill"
                        style={{ width: `${stats.rate}%`, background: h.color }}
                      />
                    </span>
                    <span className="hr-rate" style={{ color: h.color }}>
                      {stats.rate}%
                    </span>
                    <span className={`hr-delta ${flat ? "flat" : up ? "up" : "down"}`}>
                      {flat ? "±0" : `${up ? "▲" : "▼"} ${Math.abs(trend.delta)}`}
                    </span>
                    <span className="hr-streak">🔥 {streak}d</span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
