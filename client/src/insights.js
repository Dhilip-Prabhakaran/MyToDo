// Pure functions that turn raw state into report numbers.

// A "day" runs 06:00 → 05:59 the next morning, so late-night work
// (e.g. finishing a task at 1 AM) still counts toward the previous day.
export const DAY_START_HOUR = 6;

export const todayStr = () =>
  new Date(Date.now() - DAY_START_HOUR * 3600000).toLocaleDateString("en-CA");

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA");
}

export function daysBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
}

export function fmtDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function pct(done, total) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// Manual drag order first (older milestones have no `order` field), then creation order.
export function sortMilestones(list) {
  return [...list].sort(
    (a, b) =>
      (a.order ?? 1e9) - (b.order ?? 1e9) || (a.createdAt || "").localeCompare(b.createdAt || "")
  );
}

// Tasks scheduled for a given day, with completion stats.
// A task with an endDate spans date..endDate and appears on every day in the range
// (it is still ONE task — completing it marks it done for the whole range).
export function dayStats(subtasks, dateStr) {
  const tasks = subtasks.filter((s) =>
    s.endDate ? s.date <= dateStr && dateStr <= s.endDate : s.date === dateStr
  );
  const done = tasks.filter((s) => s.done).length;
  return { tasks, done, total: tasks.length, pct: pct(done, tasks.length) };
}

// Human label for a task's scheduled day(s).
export function taskDateLabel(task) {
  return task.endDate ? `${fmtDate(task.date)}–${fmtDate(task.endDate)}` : fmtDate(task.date);
}

// Milestone progress vs. where it *should* be by today ("on time" insight).
export function milestoneStats(milestone, subtasks) {
  const tasks = subtasks.filter((s) => s.milestoneId === milestone.id);
  const done = tasks.filter((s) => s.done).length;
  const completion = pct(done, tasks.length);

  const today = todayStr();
  const totalDays = Math.max(daysBetween(milestone.startDate, milestone.dueDate), 1);
  const elapsed = Math.min(Math.max(daysBetween(milestone.startDate, today), 0), totalDays);
  const expected = Math.round((elapsed / totalDays) * 100);
  const daysLeft = daysBetween(today, milestone.dueDate);

  let status;
  if (tasks.length > 0 && done === tasks.length) status = "done";
  else if (daysLeft < 0) status = "overdue";
  else if (tasks.length === 0) status = "empty";
  else if (completion >= expected) status = "on-track";
  else status = "behind";

  return { tasks, done, total: tasks.length, completion, expected, daysLeft, status };
}

// Overall target progress across all of its milestones' subtasks.
export function targetStats(target, milestones, subtasks) {
  const ms = milestones.filter((m) => m.targetId === target.id);
  const msIds = new Set(ms.map((m) => m.id));
  const tasks = subtasks.filter((s) => msIds.has(s.milestoneId));
  const done = tasks.filter((s) => s.done).length;
  const daysLeft = daysBetween(todayStr(), target.targetDate);
  return {
    milestones: ms,
    done,
    total: tasks.length,
    completion: pct(done, tasks.length),
    daysLeft,
  };
}

// Completion % for each of the last n days (oldest first) — feeds the bar chart.
export function lastNDays(subtasks, n = 14) {
  const today = todayStr();
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    days.push({ date, ...dayStats(subtasks, date) });
  }
  return days;
}

// Consecutive fully-completed days ending today (or yesterday if today isn't over).
export function streak(subtasks) {
  let count = 0;
  let date = todayStr();
  const todayDone = dayStats(subtasks, date);
  if (todayDone.total === 0 || todayDone.done < todayDone.total) date = addDays(date, -1);
  for (;;) {
    const { total, done } = dayStats(subtasks, date);
    if (total === 0 || done < total) break;
    count++;
    date = addDays(date, -1);
  }
  return count;
}
