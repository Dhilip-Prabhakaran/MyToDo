import { useState } from "react";
import { api } from "../api.js";
import { todayStr, taskDateLabel, sortMilestones } from "../insights.js";
import TaskEditModal from "./TaskEditModal.jsx";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "missed", label: "Missed" },
  { id: "done", label: "Done" },
];

const STATUS_LABEL = {
  done: { text: "Done", cls: "chip-green" },
  missed: { text: "Missed", cls: "chip-red" },
  pending: { text: "Pending", cls: "chip-gold" },
};

// Three-way lifecycle bucket: done, missed (overdue, unfinished), or
// pending (due today or in the future, unfinished).
function bucketOf(task, today) {
  if (task.done) return "done";
  if ((task.endDate || task.date) < today) return "missed";
  return "pending";
}

// The full task journal — every task ever planned, past and future — with
// an insights summary of what's done, missed, and still pending.
export default function HistoryPage({ data, refresh }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [targetId, setTargetId] = useState("all");
  const [milestoneId, setMilestoneId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const today = todayStr();

  const filtersActive =
    query !== "" || targetId !== "all" || milestoneId !== "all" || from !== "" || to !== "";

  const clearFilters = () => {
    setQuery("");
    setTargetId("all");
    setMilestoneId("all");
    setFrom("");
    setTo("");
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

  // Insight counts reflect the search/target/milestone/date filters, but not
  // the status chip below, so the numbers stay a stable summary of the view.
  const scoped = data.subtasks.filter(matchesFilters);
  const counts = { done: 0, missed: 0, pending: 0 };
  for (const s of scoped) counts[bucketOf(s, today)]++;

  const rows = scoped
    .filter((s) => filter === "all" || bucketOf(s, today) === filter)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 className="section-title">Task history</h2>
          <p className="card-sub">
            Every task you've planned — what's done, what's missed, and what's still ahead.
          </p>
        </div>
      </div>

      <section className="card stat-row">
        <div className="stat">
          <span className="stat-num">{scoped.length}</span>
          <span className="stat-label">total tasks</span>
        </div>
        <div className="stat">
          <span className="stat-num c2">{counts.done}</span>
          <span className="stat-label">completed</span>
        </div>
        <div className="stat">
          <span className="stat-num c4">{counts.missed}</span>
          <span className="stat-label">missed</span>
        </div>
        <div className="stat">
          <span className="stat-num c1">{counts.pending}</span>
          <span className="stat-label">pending</span>
        </div>
      </section>

      <section className="card table-card">
        <div className="card-head">
          <div>
            <h3>All tasks</h3>
            <p className="card-sub">
              {rows.length} task{rows.length === 1 ? "" : "s"} shown
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

        {rows.length === 0 ? (
          <p className="hint">No tasks match this view.</p>
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
                  const status = STATUS_LABEL[bucketOf(task, today)];
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
                      <td className="col-soft" data-label="Milestone">
                        {milestone?.title || "—"}
                      </td>
                      <td data-label="Target">
                        <span className="target-cell">
                          <span
                            className="cal-dot"
                            style={{ background: target?.color || "#c8cbdb" }}
                          />
                          {target?.title || "—"}
                        </span>
                      </td>
                      <td className="col-soft" data-label="Date">
                        {taskDateLabel(task)}
                      </td>
                      <td data-label="Status">
                        <span className={`chip ${status.cls}`}>{status.text}</span>
                      </td>
                      <td className="col-actions">
                        <span className="row-actions">
                          <button
                            className="btn-icon"
                            title="Edit task"
                            onClick={() => setEditingTask(task)}
                          >
                            Edit
                          </button>
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
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editingTask && (
        <TaskEditModal task={editingTask} onClose={() => setEditingTask(null)} refresh={refresh} />
      )}
    </div>
  );
}
