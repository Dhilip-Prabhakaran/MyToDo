import { useState } from "react";
import { api } from "../api.js";
import { todayStr, sortMilestones } from "../insights.js";

// Capture-first task entry for Home: pick a milestone, type, done — no trip
// to the Targets page. Collapsed to a single button until needed.
export default function QuickAdd({ data, refresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ milestoneId: "", title: "", date: todayStr() });
  const [saving, setSaving] = useState(false);

  if (data.milestones.length === 0) return null; // nothing to attach a task to yet

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await api.addSubtask(form.milestoneId, { title: form.title, date: form.date });
    setSaving(false);
    setForm({ ...form, title: "" }); // keep milestone + date for rapid entry
    refresh();
  };

  if (!open) {
    return (
      <button className="btn btn-ghost btn-small quickadd-toggle" onClick={() => setOpen(true)}>
        ＋ Quick task
      </button>
    );
  }

  return (
    <form className="subtask-form quickadd-form" onSubmit={submit}>
      <select
        value={form.milestoneId}
        onChange={(e) => setForm({ ...form, milestoneId: e.target.value })}
        required
      >
        <option value="" disabled>
          Milestone…
        </option>
        {data.targets.map((t) => (
          <optgroup key={t.id} label={t.title}>
            {sortMilestones(data.milestones.filter((m) => m.targetId === t.id)).map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <input
        placeholder="Task for today…"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
        autoFocus
      />
      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        required
      />
      <button type="submit" className="btn btn-small" disabled={saving}>
        {saving ? "Adding…" : "Add"}
      </button>
      <button type="button" className="btn btn-ghost btn-small" onClick={() => setOpen(false)}>
        Close
      </button>
    </form>
  );
}
