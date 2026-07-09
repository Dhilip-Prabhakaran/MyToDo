import { useState } from "react";
import { api } from "../api.js";
import { todayStr, taskDateLabel, sortMilestones } from "../insights.js";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
];

const pad = (n) => String(n + 1).padStart(2, "0");

// Three scopes:
//  - viewDate given: tasks in that month (calendar modal)
//  - history: everything up to today, newest first (Targets page)
//  - default: upcoming tasks plus unfinished past ones (Home)
export default function PlannedTable({
  data,
  refresh,
  viewDate,
  history = false,
  title = "Planned tasks",
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [targetId, setTargetId] = useState("all");
  const [milestoneId, setMilestoneId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const today = todayStr();

  const filtersActive =
    query !== "" || targetId !== "all" || milestoneId !== "all" || from !== "" || to !== "";

  const clearFilters = () => {
    setQuery("");
    setTargetId("all");
    setMilestoneId("all");
    setFrom("");
    setTo("");
    setFilter("all");
  };

  const inScope = (s) => {
    if (history) return s.date <= today;
    if (viewDate) {
      const monthStart = `${viewDate.year}-${pad(viewDate.month)}-01`;
      const monthEnd = `${viewDate.year}-${pad(viewDate.month)}-31`;
      return s.date <= monthEnd && (s.endDate || s.date) >= monthStart;
    }
    return (s.endDate || s.date) >= today || !s.done;
  };

  const milestoneById = Object.fromEntries(data.milestones.map((m) => [m.id, m]));
  const targetById = Object.fromEntries(data.targets.map((t) => [t.id, t]));

  const matchesFilters = (s) => {
    if (query && !s.title.toLowerCase().includes(query.toLowerCase())) return false;
    const milestone = milestoneById[s.milestoneId];
    if (targetId !== "all" && milestone?.targetId !== targetId) return false;
    if (milestoneId !== "all" && s.milestoneId !== milestoneId) return false;
    if (from && (s.endDate || s.date) < from) return false;
    if (to && s.date > to) return false;
    return true;
  };

  const rows = data.subtasks
    .filter(inScope)
    .filter(matchesFilters)
    .filter((s) => (filter === "open" ? !s.done : filter === "done" ? s.done : true))
    .sort((a, b) =>
      history
        ? b.date.localeCompare(a.date) || a.title.localeCompare(b.title)
        : a.date.localeCompare(b.date) || a.title.localeCompare(b.title)
    );

  const openCount = rows.filter((r) => !r.done).length;

  const statusOf = (task) => {
    if (task.done) return { text: "Done", cls: "chip-green" };
    if ((task.endDate || task.date) < today) return { text: "Overdue", cls: "chip-red" };
    if (task.date <= today && today <= (task.endDate || task.date))
      return { text: "In progress", cls: "chip-gold" };
    return { text: "Planned", cls: "chip-grey" };
  };

  return (
    <section className="card table-card">
      <div className="card-head">
        <div>
          <h3>{title}</h3>
          <p className="card-sub">
            {rows.length} task{rows.length === 1 ? "" : "s"}
            {history ? "" : viewDate ? " this month" : " planned"} ·{" "}
            {history ? `${rows.length - openCount} completed` : `${openCount} open`}
          </p>
        </div>
        <div className="filter-chips">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-chip ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {history && (
        <div className="table-filters">
          <input
            className="tf-search"
            placeholder="Search tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            value={targetId}
            onChange={(e) => {
              setTargetId(e.target.value);
              setMilestoneId("all");
            }}
          >
            <option value="all">All targets</option>
            {data.targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
            <option value="all">All milestones</option>
            {sortMilestones(data.milestones)
              .filter((m) => targetId === "all" || m.targetId === targetId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
          </select>
          <label className="tf-date">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="tf-date">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          {filtersActive && (
            <button className="btn-icon" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="hint">
          {history
            ? "No task history yet — completed and past tasks will appear here."
            : "Nothing here — open the planning calendar to schedule tasks."}
        </p>
      ) : (
        <div className="table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th className="col-check"></th>
                <th>Task</th>
                <th>Milestone</th>
                <th>Target</th>
                <th>Date</th>
                <th>Status</th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((task) => {
                const milestone = milestoneById[task.milestoneId];
                const target = milestone ? targetById[milestone.targetId] : null;
                const status = statusOf(task);
                return (
                  <tr key={task.id} className={task.done ? "row-done" : ""}>
                    <td className="col-check">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={async () => {
                          await api.updateSubtask(task.id, { done: !task.done });
                          refresh();
                        }}
                      />
                    </td>
                    <td className="col-task">{task.title}</td>
                    <td className="col-soft">{milestone?.title || "—"}</td>
                    <td>
                      <span className="target-cell">
                        <span
                          className="cal-dot"
                          style={{ background: target?.color || "#c8cbdb" }}
                        />
                        {target?.title || "—"}
                      </span>
                    </td>
                    <td className="col-soft">{taskDateLabel(task)}</td>
                    <td>
                      <span className={`chip ${status.cls}`}>{status.text}</span>
                    </td>
                    <td className="col-actions">
                      <button
                        className="btn-icon btn-danger"
                        title="Delete task"
                        onClick={async () => {
                          await api.deleteSubtask(task.id);
                          refresh();
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
