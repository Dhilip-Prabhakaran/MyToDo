import { useState } from "react";
import { api } from "../api.js";
import {
  milestoneStats,
  targetStats,
  sortMilestones,
  todayStr,
  fmtDate,
  taskDateLabel,
} from "../insights.js";

// Warm, Claude-adjacent palette for target accents.
const COLORS = [
  "#d97757",
  "#b8552f",
  "#d4a027",
  "#588157",
  "#3e7c8a",
  "#5b6c9e",
  "#8b5e83",
  "#a64d4d",
];

const STATUS_LABELS = {
  "on-track": { text: "On track", cls: "chip-green" },
  behind: { text: "Behind", cls: "chip-red" },
  done: { text: "Done", cls: "chip-gold" },
  overdue: { text: "Overdue", cls: "chip-red" },
  empty: { text: "No tasks yet", cls: "chip-grey" },
};

function TargetForm({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    color: COLORS[6],
    startDate: todayStr(),
    targetDate: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    await api.addTarget(form);
    setForm({ ...form, title: "", description: "", targetDate: "" });
    setOpen(false);
    onSaved();
  };

  if (!open) {
    return (
      <div className="targets-toolbar">
        <button className="btn btn-small" onClick={() => setOpen(true)}>
          ＋ New Target
        </button>
      </div>
    );
  }
  return (
    <form className="card form-card" onSubmit={submit}>
      <h3>New target</h3>
      <input
        placeholder="Big goal, e.g. Master Gen AI"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
        autoFocus
      />
      <textarea
        placeholder="Why does this matter? (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
      />
      <div className="form-row">
        <label>
          Start
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </label>
        <label>
          Target date
          <input
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            required
          />
        </label>
      </div>
      <div className="swatches">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`swatch ${form.color === c ? "selected" : ""}`}
            style={{ background: c }}
            onClick={() => setForm({ ...form, color: c })}
          />
        ))}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn">
          Save
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function SubtaskForm({ milestone, onSaved }) {
  const [form, setForm] = useState({ title: "", date: todayStr(), repeatDays: 1 });

  const submit = async (e) => {
    e.preventDefault();
    await api.addSubtask(milestone.id, form);
    setForm({ ...form, title: "" });
    onSaved();
  };

  return (
    <form className="subtask-form" onSubmit={submit}>
      <input
        placeholder="Daily task, e.g. 30 min course video"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        required
      />
      <label className="repeat-label">
        repeat
        <input
          type="number"
          min="1"
          max="90"
          value={form.repeatDays}
          onChange={(e) => setForm({ ...form, repeatDays: e.target.value })}
        />
        day(s)
      </label>
      <button type="submit" className="btn btn-small">
        Add
      </button>
    </form>
  );
}

function MilestoneRow({ milestone, subtasks, color, refresh, dnd }) {
  const [expanded, setExpanded] = useState(false);
  const stats = milestoneStats(milestone, subtasks);
  const badge = STATUS_LABELS[stats.status];

  return (
    <div
      className={`milestone ${dnd.isDragging ? "dragging" : ""} ${dnd.isOver ? "drag-over" : ""}`}
      onDragOver={dnd.onDragOver}
      onDrop={dnd.onDrop}
    >
      <button
        className="milestone-head"
        draggable
        onDragStart={dnd.onDragStart}
        onDragEnd={dnd.onDragEnd}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="drag-handle" title="Hold and drag to reorder">
          ⠿
        </span>
        <span className="expander">{expanded ? "▾" : "▸"}</span>
        <span className="milestone-title">{milestone.title}</span>
        <span className={`chip ${badge.cls}`}>{badge.text}</span>
        <span className="milestone-due">due {fmtDate(milestone.dueDate)}</span>
        <span className="mini-bar">
          <span className="mini-bar-fill" style={{ width: `${stats.completion}%`, background: color }} />
        </span>
        <span className="milestone-pct">{stats.completion}%</span>
      </button>
      {expanded && (
        <div className="milestone-body">
          <ul className="task-list">
            {stats.tasks
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((task) => (
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
                  <span className="task-date">{taskDateLabel(task)}</span>
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
              ))}
          </ul>
          <SubtaskForm milestone={milestone} onSaved={refresh} />
          <button
            className="btn-icon btn-danger"
            onClick={async () => {
              if (confirm(`Delete milestone "${milestone.title}" and its tasks?`)) {
                await api.deleteMilestone(milestone.id);
                refresh();
              }
            }}
          >
            Delete milestone
          </button>
        </div>
      )}
    </div>
  );
}

function MilestoneForm({ target, onSaved }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", startDate: todayStr(), dueDate: "" });

  const submit = async (e) => {
    e.preventDefault();
    await api.addMilestone(target.id, form);
    setForm({ title: "", startDate: todayStr(), dueDate: "" });
    setOpen(false);
    onSaved();
  };

  if (!open) {
    return (
      <button className="btn btn-ghost btn-small" onClick={() => setOpen(true)}>
        ＋ Add milestone
      </button>
    );
  }
  return (
    <form className="subtask-form" onSubmit={submit}>
      <input
        placeholder="Milestone, e.g. Finish Python module"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
        autoFocus
      />
      <input
        type="date"
        title="Start date"
        value={form.startDate}
        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        required
      />
      <input
        type="date"
        title="Due date"
        value={form.dueDate}
        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        required
      />
      <button type="submit" className="btn btn-small">
        Save
      </button>
      <button type="button" className="btn btn-ghost btn-small" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  );
}

function TargetCard({ target, data, refresh }) {
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState({ id: null, over: null });
  const stats = targetStats(target, data.milestones, data.subtasks);
  const ordered = sortMilestones(stats.milestones);

  return (
    <section className="card target-card" style={{ "--accent-color": target.color }}>
      <div
        className="target-head clickable"
        onClick={() => setOpen(!open)}
        title={open ? "Collapse milestones" : "Expand milestones"}
      >
        <div>
          <h2>
            <span className="expander">{open ? "▾" : "▸"}</span> {target.title}
          </h2>
          {target.description && <p className="target-desc">{target.description}</p>}
          <p className="target-dates">
            {fmtDate(target.startDate)} → {fmtDate(target.targetDate)} ·{" "}
            {stats.daysLeft >= 0 ? `${stats.daysLeft} days left` : "past target date"} ·{" "}
            {stats.done}/{stats.total} tasks · {ordered.length} milestones
          </p>
        </div>
        <div className="target-head-right">
          <div className="big-pct" style={{ color: target.color }}>
            {stats.completion}%
          </div>
          <button
            className="btn-icon btn-danger"
            title="Delete target"
            onClick={async (e) => {
              e.stopPropagation();
              if (confirm(`Delete target "${target.title}" and everything under it?`)) {
                await api.deleteTarget(target.id);
                refresh();
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${stats.completion}%`, background: target.color }}
        />
      </div>
      {open && (
        <div className="milestones">
          {ordered.map((m) => (
            <MilestoneRow
              key={m.id}
              milestone={m}
              subtasks={data.subtasks}
              color={target.color}
              refresh={refresh}
              dnd={{
                isDragging: drag.id === m.id,
                isOver: drag.over === m.id && drag.id !== m.id,
                onDragStart: (e) => {
                  e.dataTransfer.setData("text/plain", m.id);
                  e.dataTransfer.effectAllowed = "move";
                  setDrag({ id: m.id, over: null });
                },
                onDragEnd: () => setDrag({ id: null, over: null }),
                onDragOver: (e) => {
                  if (!drag.id) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (drag.over !== m.id) setDrag((d) => ({ ...d, over: m.id }));
                },
                onDrop: async (e) => {
                  e.preventDefault();
                  setDrag({ id: null, over: null });
                  if (!drag.id || drag.id === m.id) return;
                  const ids = ordered.map((x) => x.id);
                  const from = ids.indexOf(drag.id);
                  const to = ids.indexOf(m.id);
                  ids.splice(from, 1);
                  ids.splice(to, 0, drag.id);
                  await api.reorderMilestones(target.id, ids);
                  refresh();
                },
              }}
            />
          ))}
          <MilestoneForm target={target} onSaved={refresh} />
        </div>
      )}
    </section>
  );
}

export default function Targets({ data, refresh }) {
  return (
    <div className="targets">
      <TargetForm onSaved={refresh} />
      {data.targets.map((target) => (
        <TargetCard key={target.id} target={target} data={data} refresh={refresh} />
      ))}
    </div>
  );
}
