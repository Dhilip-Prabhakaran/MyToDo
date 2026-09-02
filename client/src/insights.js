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

// Tasks TOUCHING a given day (range semantics), with completion stats.
// A task with an endDate spans date..endDate and appears on every day in the range.
// Used by the Calendar to draw a spanning task across the grid. For "what must I
// finish today", use dueStats instead.
export function dayStats(subtasks, dateStr) {
  const tasks = subtasks.filter((s) =>
    s.endDate ? s.date <= dateStr && dateStr <= s.endDate : s.date === dateStr
  );
  const done = tasks.filter((s) => s.done).length;
  return { tasks, done, total: tasks.length, pct: pct(done, tasks.length) };
}

// Tasks DUE on a given day (due-date semantics), with completion stats.
// A spanning task (endDate set) is ONE piece of work to finish by its final day —
// not a daily obligation — so it counts toward exactly that one day, not every day
// in the range. Single tasks are due on their date. This drives the daily list,
// the streak, and the 14-day chart, so a multi-day task isn't a nagging unchecked
// row (dragging the day's %) on each of its in-progress days.
export function dueStats(subtasks, dateStr) {
  const tasks = subtasks.filter((s) => (s.endDate || s.date) === dateStr);
  const done = tasks.filter((s) => s.done).length;
  return { tasks, done, total: tasks.length, pct: pct(done, tasks.length) };
}

// Human label for a task's scheduled day(s).
export function taskDateLabel(task) {
  return task.endDate ? `${fmtDate(task.date)}–${fmtDate(task.endDate)}` : fmtDate(task.date);
}

// Milestone health. "Behind" is driven by tasks past their OWN due date —
// not by elapsed time — so a spanning task still inside its window (endDate in
// the future) never marks a milestone behind before it is actually late.
export function milestoneStats(milestone, subtasks) {
  const tasks = subtasks.filter((s) => s.milestoneId === milestone.id);
  const done = tasks.filter((s) => s.done).length;
  const completion = pct(done, tasks.length);

  const today = todayStr();
  const daysLeft = daysBetween(today, milestone.dueDate);
  const overdue = tasks.filter((s) => !s.done && (s.endDate || s.date) < today).length;

  let status;
  if (tasks.length > 0 && done === tasks.length) status = "done";
  else if (daysLeft < 0) status = "overdue";
  else if (tasks.length === 0) status = "empty";
  else if (overdue > 0) status = "behind";
  else status = "on-track";

  return { tasks, done, total: tasks.length, completion, daysLeft, overdue, status };
}

// The app-day (06:00 boundary) a completion timestamp falls on. Lets a row that
// was just ticked stay visible (struck through) until the day rolls over, instead
// of vanishing on the click.
export function dayOf(iso) {
  return iso
    ? new Date(new Date(iso).getTime() - DAY_START_HOUR * 3600000).toLocaleDateString("en-CA")
    : null;
}

// Tasks whose due date (endDate for a span, else date) is already past and are
// still unfinished — the only things that genuinely "need attention". A task
// completed today lingers (struck through) until tomorrow, matching the daily list.
export function overdueTasks(subtasks) {
  const today = todayStr();
  return subtasks
    .filter((s) => (s.endDate || s.date) < today && (!s.done || dayOf(s.doneAt) === today))
    .sort((a, b) => (a.endDate || a.date).localeCompare(b.endDate || b.date));
}

// Spanning tasks currently in progress — started, but not yet at their due day.
// (On the due day itself they appear in the normal "today" list via dueStats.)
// A task completed today lingers until tomorrow rather than vanishing on the tick.
export function inProgressSpanning(subtasks) {
  const today = todayStr();
  return subtasks
    .filter(
      (s) =>
        s.endDate &&
        s.date <= today &&
        today < s.endDate &&
        (!s.done || dayOf(s.doneAt) === today)
    )
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
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
// Due-date semantics: a spanning task counts on its final day only.
export function lastNDays(subtasks, n = 14) {
  const today = todayStr();
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    days.push({ date, ...dueStats(subtasks, date) });
  }
  return days;
}

// Day-streak grace: how many "off" days (a missed task or a bare day) the streak
// tolerates before it breaks, and how many good days refill that budget — so one
// or two busy days don't wipe your momentum. Mirrors the habit-streak grace.
const STREAK_GRACE = 2;
const STREAK_RECHARGE = 7;

// Classify a single day for the streak:
//   "good"  — everything DUE that day was completed, OR a multi-day task was in
//             progress that day (you were working on it, even if nothing was due).
//   "miss"  — something was due (a daily task, or a span on its end date) and was
//             left unfinished.
//   "empty" — nothing due and no span in progress (a bare day).
function classifyDay(subtasks, date) {
  const { total, done } = dueStats(subtasks, date);
  if (total > 0) return done === total ? "good" : "miss";
  const activeSpan = subtasks.some((s) => s.endDate && s.date <= date && date <= s.endDate);
  return activeSpan ? "good" : "empty";
}

// Consecutive productive days ending today. A day counts when you finish what's
// due OR keep a multi-day task moving; it breaks on a genuine miss (a due task or
// a span's end date left unfinished) — but tolerates up to STREAK_GRACE off days.
export function streak(subtasks) {
  let count = 0;
  let date = todayStr();
  // Don't penalise today while it may still be in progress.
  if (classifyDay(subtasks, date) !== "good") date = addDays(date, -1);

  let grace = STREAK_GRACE;
  let goodRun = 0;
  for (let guard = 0; guard < 366; guard++) {
    const kind = classifyDay(subtasks, date);
    if (kind === "good") {
      count++;
      if (++goodRun >= STREAK_RECHARGE) {
        grace = STREAK_GRACE;
        goodRun = 0;
      }
    } else if (grace > 0) {
      grace--;
      goodRun = 0;
    } else {
      break;
    }
    date = addDays(date, -1);
  }
  return count;
}

// ---------- habits & the daily health score ----------
// A habit carries `points`; completing it earns them, and a day's health score
// is the sum earned vs the max if everything were done. Two scoring types:
//   binary — done or not: full points or 0.
//   graded — an intake level (0–100 %): that share of the points.
// A "rest" day earns full points within the habit's weekly restAllowance.

const habitPoints = (h) => h.points ?? 10;

const logOf = (habitLogs, habitId, dateStr) =>
  habitLogs.find((l) => l.habitId === habitId && l.date === dateStr);

// Intake level recorded for a habit on a day, 0–100. A plain "done" or a rest
// both read as 100; older logs stored only a `done` flag.
export function habitValueOn(habitLogs, habitId, dateStr) {
  const l = logOf(habitLogs, habitId, dateStr);
  if (!l) return 0;
  return l.value ?? (l.done ? 100 : 0);
}

export function isHabitDoneOn(habit, habitLogs, dateStr) {
  return habitValueOn(habitLogs, habit.id, dateStr) > 0;
}

// A rest day earns full points only within the weekly allowance: within the
// rolling 7 days ending on dateStr, the earliest `restAllowance` rest days are
// honoured; further rests that week earn nothing.
export function restHonoredOn(habit, habitLogs, dateStr) {
  const l = logOf(habitLogs, habit.id, dateStr);
  if (!l || !l.rest) return false;
  const allowance = habit.restAllowance ?? 0;
  if (allowance <= 0) return false;
  const start = addDays(dateStr, -6);
  const restDays = habitLogs
    .filter((x) => x.habitId === habit.id && x.rest && x.date >= start && x.date <= dateStr)
    .map((x) => x.date)
    .sort();
  return restDays.indexOf(dateStr) < allowance;
}

// Points this habit earned on a given day.
export function habitPointsOn(habit, habitLogs, dateStr) {
  const l = logOf(habitLogs, habit.id, dateStr);
  if (!l) return 0;
  const pts = habitPoints(habit);
  if (l.rest) return restHonoredOn(habit, habitLogs, dateStr) ? pts : 0;
  const value = l.value ?? (l.done ? 100 : 0);
  return Math.round((pts * value) / 100);
}

// The whole day's health score: points earned vs the max if everything were done.
export function dayScore(habits, habitLogs, dateStr) {
  let earned = 0;
  let max = 0;
  for (const h of habits) {
    max += habitPoints(h);
    earned += habitPointsOn(h, habitLogs, dateStr);
  }
  return { earned, max, pct: max ? Math.round((earned / max) * 100) : 0 };
}

export const todayScore = (habits, habitLogs) => dayScore(habits, habitLogs, todayStr());

// Daily health score over the last n days (oldest first) — feeds a score trend.
export function lastNDaysScore(habits, habitLogs, n = 14) {
  const today = todayStr();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    out.push({ date, ...dayScore(habits, habitLogs, date) });
  }
  return out;
}

// Consecutive days the habit was done (any value > 0, incl. rest), with ONE
// grace skip that recharges after 7 done-days — a single off day doesn't erase
// months of momentum.
export function habitStreak(habit, habitLogs) {
  const done = new Set(
    habitLogs
      .filter((l) => l.habitId === habit.id && (l.value ?? (l.done ? 100 : 0)) > 0)
      .map((l) => l.date)
  );

  let count = 0;
  let date = todayStr();
  if (!done.has(date)) date = addDays(date, -1);
  let daysSinceGrace = 0;
  let graceUsed = false;
  for (;;) {
    if (done.has(date)) {
      count++;
      daysSinceGrace++;
      if (daysSinceGrace >= 7) {
        graceUsed = false;
        daysSinceGrace = 0;
      }
    } else if (!graceUsed) {
      graceUsed = true;
      daysSinceGrace = 0;
    } else {
      break;
    }
    date = addDays(date, -1);
  }
  return count;
}

// Per-day history over the last n days (oldest first) — feeds the month calendar
// and the 30-day consistency count. `value` is the intake level, `done` any > 0.
export function habitLastNDays(habit, habitLogs, n = 30) {
  const today = todayStr();
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const value = habitValueOn(habitLogs, habit.id, date);
    days.push({ date, done: value > 0, value });
  }
  return days;
}

// ---------- habit analytics (report page) ----------

// Completion over the last n days: how many days done, the % rate, the average
// intake level on days it was done, and the day-by-day series (oldest first).
export function habitStats(habit, habitLogs, n = 30) {
  const days = habitLastNDays(habit, habitLogs, n);
  const doneDays = days.filter((d) => d.done);
  const rate = Math.round((doneDays.length / n) * 100);
  const avgLevel = doneDays.length
    ? Math.round(doneDays.reduce((s, d) => s + d.value, 0) / doneDays.length)
    : 0;
  return { done: doneDays.length, total: n, rate, avgLevel, days };
}

// Momentum: completion rate of the recent half of the window vs the earlier
// half. delta > 0 means improving, < 0 means slipping.
export function habitTrend(habit, habitLogs, n = 28) {
  const days = habitLastNDays(habit, habitLogs, n);
  const mid = Math.floor(n / 2);
  const older = days.slice(0, n - mid);
  const recent = days.slice(n - mid);
  const rateOf = (arr) =>
    arr.length ? Math.round((arr.filter((d) => d.done).length / arr.length) * 100) : 0;
  const recentRate = rateOf(recent);
  const prevRate = rateOf(older);
  return { recentRate, prevRate, delta: recentRate - prevRate };
}
