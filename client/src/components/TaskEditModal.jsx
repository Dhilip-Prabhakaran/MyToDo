import { useEffect, useState } from "react";
import { api } from "../api.js";

// Shared modal for editing a task's title and date(s) — usable from any
// task list in the app (milestone rows, planned tasks, history).
export default function TaskEditModal({ task, onClose, refresh }) {
  const [form, setForm] = useState({
    title: task.title,
    date: task.date,
    endDate: task.endDate || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await api.updateSubtask(task.id, {
      title: form.title,
      date: form.date,
      endDate: form.endDate || null,
    });
    setSaving(false);
    refresh();
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal modal-narrow" role="dialog" aria-label="Edit task">
        <div className="modal-head">
          <h3>Edit task</h3>
          <button className="btn-icon" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        <form className="form-card" onSubmit={submit}>
          <input
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            autoFocus
          />
          <div className="form-row">
            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </label>
            <label>
              End date (optional)
              <input
                type="date"
                value={form.endDate}
                min={form.date}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
