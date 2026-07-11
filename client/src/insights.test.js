import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  todayStr,
  dayOf,
  addDays,
  dayStats,
  dueStats,
  overdueTasks,
  inProgressSpanning,
  milestoneStats,
  streak,
  habitStreak,
  habitWeekProgress,
} from "./insights.js";

// All tests pin the clock to a fixed LOCAL time so the 06:00 app-day
// boundary and toLocaleDateString stay deterministic in any timezone.
// "Now" = 11 Jul 2026, 12:00 local → app-day 2026-07-11.
const NOW = new Date(2026, 6, 11, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

const iso = (y, m, d, h, min = 0) => new Date(y, m - 1, d, h, min).toISOString();

let seq = 0;
const task = (over) => ({
  id: `t${++seq}`,
  milestoneId: "m1",
  title: "task",
  date: "2026-07-11",
  endDate: null,
  done: false,
  doneAt: null,
  ...over,
});

describe("todayStr — the 06:00 day boundary", () => {
  it("counts 05:59 as the previous day", () => {
    vi.setSystemTime(new Date(2026, 6, 11, 5, 59));
    expect(todayStr()).toBe("2026-07-10");
  });

  it("rolls over at 06:00", () => {
    vi.setSystemTime(new Date(2026, 6, 11, 6, 0));
    expect(todayStr()).toBe("2026-07-11");
  });
});

describe("dayOf — completion timestamp → app-day", () => {
  it("maps a small-hours completion to the previous app-day", () => {
    expect(dayOf(iso(2026, 7, 11, 1, 30))).toBe("2026-07-10");
  });

  it("maps a daytime completion to the same day", () => {
    expect(dayOf(iso(2026, 7, 11, 9, 0))).toBe("2026-07-11");
  });

  it("returns null for a missing timestamp", () => {
    expect(dayOf(null)).toBeNull();
  });
});

describe("dueStats vs dayStats — spanning-task semantics", () => {
  const span = task({ date: "2026-07-09", endDate: "2026-07-12" });
  const single = task({ date: "2026-07-11" });

  it("dueStats counts a span ONLY on its end day", () => {
    expect(dueStats([span], "2026-07-11").total).toBe(0); // mid-range
    expect(dueStats([span], "2026-07-12").total).toBe(1); // end day
    expect(dueStats([span], "2026-07-09").total).toBe(0); // start day
  });

  it("dueStats counts a single task on its date", () => {
    expect(dueStats([single], "2026-07-11").total).toBe(1);
    expect(dueStats([single], "2026-07-12").total).toBe(0);
  });

  it("dayStats keeps range semantics for the calendar (every day touched)", () => {
    for (const d of ["2026-07-09", "2026-07-10", "2026-07-11", "2026-07-12"]) {
      expect(dayStats([span], d).total).toBe(1);
    }
    expect(dayStats([span], "2026-07-13").total).toBe(0);
  });
});

describe("overdueTasks — only genuinely late work", () => {
  it("includes an unfinished task past its due date", () => {
    const t = task({ date: "2026-07-09" });
    expect(overdueTasks([t])).toHaveLength(1);
  });

  it("excludes tasks due today or later, and in-window spans", () => {
    const today = task({ date: "2026-07-11" });
    const future = task({ date: "2026-07-12" });
    const span = task({ date: "2026-07-09", endDate: "2026-07-13" });
    expect(overdueTasks([today, future, span])).toHaveLength(0);
  });

  it("uses a span's endDate as its due date", () => {
    const lateSpan = task({ date: "2026-07-05", endDate: "2026-07-10" });
    expect(overdueTasks([lateSpan])).toHaveLength(1);
  });

  it("lets a task completed TODAY linger, but drops one completed yesterday", () => {
    const doneToday = task({ date: "2026-07-09", done: true, doneAt: iso(2026, 7, 11, 9, 0) });
    const doneYesterday = task({ date: "2026-07-09", done: true, doneAt: iso(2026, 7, 10, 9, 0) });
    const titles = overdueTasks([doneToday, doneYesterday]).map((t) => t.id);
    expect(titles).toEqual([doneToday.id]);
  });

  it("sorts by due date, oldest first", () => {
    const a = task({ date: "2026-07-08" });
    const b = task({ date: "2026-07-05" });
    expect(overdueTasks([a, b]).map((t) => t.id)).toEqual([b.id, a.id]);
  });
});

describe("inProgressSpanning — spans underway, not yet due", () => {
  it("includes a span whose window covers today", () => {
    const s = task({ date: "2026-07-10", endDate: "2026-07-13" });
    expect(inProgressSpanning([s])).toHaveLength(1);
  });

  it("excludes a span on its due day (it belongs to the daily list then)", () => {
    const s = task({ date: "2026-07-09", endDate: "2026-07-11" });
    expect(inProgressSpanning([s])).toHaveLength(0);
  });

  it("excludes spans not yet started, and single-day tasks", () => {
    const notStarted = task({ date: "2026-07-12", endDate: "2026-07-14" });
    const single = task({ date: "2026-07-11" });
    expect(inProgressSpanning([notStarted, single])).toHaveLength(0);
  });

  it("lets a span completed TODAY linger, drops one completed yesterday", () => {
    const doneToday = task({
      date: "2026-07-10",
      endDate: "2026-07-13",
      done: true,
      doneAt: iso(2026, 7, 11, 9, 0),
    });
    const doneYesterday = task({
      date: "2026-07-09",
      endDate: "2026-07-13",
      done: true,
      doneAt: iso(2026, 7, 10, 9, 0),
    });
    expect(inProgressSpanning([doneToday, doneYesterday]).map((t) => t.id)).toEqual([
      doneToday.id,
    ]);
  });
});

describe("milestoneStats — behind means overdue tasks, not elapsed time", () => {
  const milestone = { id: "m1", startDate: "2026-07-01", dueDate: "2026-07-31" };

  it("is on-track when its only task is a span still inside its window", () => {
    const s = task({ date: "2026-07-08", endDate: "2026-07-14" });
    expect(milestoneStats(milestone, [s]).status).toBe("on-track");
  });

  it("is behind when a task is past its own due date", () => {
    const late = task({ date: "2026-07-09" });
    expect(milestoneStats(milestone, [late]).status).toBe("behind");
  });

  it("is done when every task is finished", () => {
    const t = task({ done: true, doneAt: iso(2026, 7, 10, 9, 0) });
    expect(milestoneStats(milestone, [t]).status).toBe("done");
  });

  it("is overdue when the milestone's own due date has passed", () => {
    const pastMilestone = { id: "m1", startDate: "2026-06-01", dueDate: "2026-07-10" };
    expect(milestoneStats(pastMilestone, [task({})]).status).toBe("overdue");
  });

  it("is empty with no tasks", () => {
    expect(milestoneStats(milestone, []).status).toBe("empty");
  });
});

describe("streak — consecutive fully-completed days", () => {
  it("counts back from today when today is complete", () => {
    const tasks = [
      task({ date: "2026-07-11", done: true }),
      task({ date: "2026-07-10", done: true }),
      task({ date: "2026-07-09", done: true }),
      task({ date: "2026-07-08" }), // breaks here
    ];
    expect(streak(tasks)).toBe(3);
  });

  it("skips an unfinished today and counts from yesterday", () => {
    const tasks = [
      task({ date: "2026-07-11" }), // today not done yet
      task({ date: "2026-07-10", done: true }),
      task({ date: "2026-07-09", done: true }),
    ];
    expect(streak(tasks)).toBe(2);
  });
});

describe("habitStreak — grace day for daily habits", () => {
  const habit = { id: "h1", frequency: "daily", timesPerWeek: 7 };
  const log = (date) => ({ id: `l${++seq}`, habitId: "h1", date, done: true });

  it("survives ONE missed day on the grace skip", () => {
    // 11 done, 10 missed (grace), 9 done, 8 done, 7 missed → break
    const logs = [log("2026-07-11"), log("2026-07-09"), log("2026-07-08")];
    expect(habitStreak(habit, logs)).toBe(3);
  });

  it("breaks on a second miss before the grace recharges", () => {
    // 11 done, 10 missed (grace), 9 missed → break immediately
    const logs = [log("2026-07-11")];
    expect(habitStreak(habit, logs)).toBe(1);
  });
});

describe("habitStreak / habitWeekProgress — weekly habits", () => {
  const habit = { id: "h1", frequency: "weekly", timesPerWeek: 2 };
  const log = (date) => ({ id: `l${++seq}`, habitId: "h1", date, done: true });
  const today = "2026-07-11";

  it("counts consecutive rolling windows that hit the target", () => {
    const logs = [
      log(addDays(today, -1)),
      log(addDays(today, -2)), // current window: 2 hits ✓
      log(addDays(today, -8)),
      log(addDays(today, -9)), // previous window: 2 hits ✓
      // window before that: 0 hits → stop
    ];
    expect(habitStreak(habit, logs)).toBe(2);
  });

  it("never breaks on the still-in-progress current window", () => {
    const logs = [
      log(addDays(today, -1)), // current window: only 1 of 2 so far — not a break
      log(addDays(today, -8)),
      log(addDays(today, -9)), // previous window: 2 hits ✓
    ];
    expect(habitStreak(habit, logs)).toBe(1);
  });

  it("habitWeekProgress counts hits in the rolling 7 days", () => {
    const logs = [log(today), log(addDays(today, -6)), log(addDays(today, -7))]; // -7 is outside
    expect(habitWeekProgress(habit, logs)).toEqual({ hits: 2, target: 2 });
  });
});
