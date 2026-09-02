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
  habitPointsOn,
  restHonoredOn,
  dayScore,
  habitStats,
  habitTrend,
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

describe("streak — productive days, with span credit and grace", () => {
  it("counts consecutive fully-completed days", () => {
    const tasks = [
      task({ date: "2026-07-11", done: true }),
      task({ date: "2026-07-10", done: true }),
      task({ date: "2026-07-09", done: true }),
      // days 8 & 7 bare (grace), day 6 bare → break; count stays 3
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

  it("credits days where a multi-day task is in progress, though nothing is due", () => {
    const tasks = [
      task({ date: "2026-07-11", done: true }), // today: daily task done
      task({ date: "2026-07-08", endDate: "2026-07-12" }), // span covers 8..12, due on 12
    ];
    // 11 good (daily), 10/9/8 good (span active), 7/6 bare (grace), 5 → break
    expect(streak(tasks)).toBe(4);
  });

  it("tolerates two busy (unfinished) days, then keeps counting", () => {
    const tasks = [
      task({ date: "2026-07-11", done: true }),
      task({ date: "2026-07-10" }), // busy day 1 (grace)
      task({ date: "2026-07-09" }), // busy day 2 (grace)
      task({ date: "2026-07-08", done: true }),
    ];
    expect(streak(tasks)).toBe(2); // days 11 and 8; the two misses don't add
  });

  it("breaks when a third busy day exhausts the grace budget", () => {
    const tasks = [
      task({ date: "2026-07-11", done: true }),
      task({ date: "2026-07-10" }),
      task({ date: "2026-07-09" }),
      task({ date: "2026-07-08" }), // third miss → break before reaching day 7
      task({ date: "2026-07-07", done: true }),
    ];
    expect(streak(tasks)).toBe(1);
  });
});

describe("habitStreak — grace day, any value counts", () => {
  const habit = { id: "h1" };
  const log = (date, value = 100) => ({ id: `l${++seq}`, habitId: "h1", date, value });

  it("survives ONE missed day on the grace skip", () => {
    // 11 done, 10 missed (grace), 9 done, 8 done, 7 missed → break
    const logs = [log("2026-07-11"), log("2026-07-09"), log("2026-07-08")];
    expect(habitStreak(habit, logs)).toBe(3);
  });

  it("breaks on a second miss before the grace recharges", () => {
    const logs = [log("2026-07-11")];
    expect(habitStreak(habit, logs)).toBe(1);
  });

  it("counts a partial (graded) day as done", () => {
    const logs = [log("2026-07-11", 50), log("2026-07-10", 25)];
    expect(habitStreak(habit, logs)).toBe(2);
  });
});

describe("habitPointsOn — binary, graded, rest", () => {
  const today = "2026-07-11";

  it("binary earns full points when done, zero otherwise", () => {
    const h = { id: "h1", points: 15, scoreType: "binary" };
    expect(habitPointsOn(h, [{ habitId: "h1", date: today, value: 100 }], today)).toBe(15);
    expect(habitPointsOn(h, [], today)).toBe(0);
  });

  it("graded earns a share of points by level", () => {
    const h = { id: "h1", points: 12, scoreType: "graded" };
    expect(habitPointsOn(h, [{ habitId: "h1", date: today, value: 75 }], today)).toBe(9);
    expect(habitPointsOn(h, [{ habitId: "h1", date: today, value: 50 }], today)).toBe(6);
  });

  it("reads legacy logs that only carry a done flag as full", () => {
    const h = { id: "h1", points: 10 };
    expect(habitPointsOn(h, [{ habitId: "h1", date: today, done: true }], today)).toBe(10);
  });

  it("a rest earns full points only within the weekly allowance", () => {
    const h = { id: "h1", points: 15, restAllowance: 2 };
    const rest = (d) => ({ habitId: "h1", date: d, rest: true, value: 100 });
    // three rests in the rolling week: first two honoured, third not
    const logs = [rest("2026-07-09"), rest("2026-07-10"), rest("2026-07-11")];
    expect(restHonoredOn(h, logs, "2026-07-09")).toBe(true);
    expect(restHonoredOn(h, logs, "2026-07-10")).toBe(true);
    expect(restHonoredOn(h, logs, "2026-07-11")).toBe(false);
    expect(habitPointsOn(h, logs, "2026-07-11")).toBe(0);
    expect(habitPointsOn(h, logs, "2026-07-10")).toBe(15);
  });

  it("a rest earns nothing when the habit allows no rests", () => {
    const h = { id: "h1", points: 15, restAllowance: 0 };
    const logs = [{ habitId: "h1", date: today, rest: true, value: 100 }];
    expect(habitPointsOn(h, logs, today)).toBe(0);
  });
});

describe("dayScore — the daily health total", () => {
  const today = "2026-07-11";
  const habits = [
    { id: "gym", points: 15, scoreType: "binary" },
    { id: "protein", points: 12, scoreType: "graded" },
    { id: "sugar", points: 8, scoreType: "binary" },
  ];

  it("sums earned points against the max", () => {
    const logs = [
      { habitId: "gym", date: today, value: 100 }, // 15
      { habitId: "protein", date: today, value: 50 }, // 6
      // sugar not done → 0
    ];
    expect(dayScore(habits, logs, today)).toEqual({ earned: 21, max: 35, pct: 60 });
  });

  it("is zero on an empty day and safe with no habits", () => {
    expect(dayScore(habits, [], today)).toEqual({ earned: 0, max: 35, pct: 0 });
    expect(dayScore([], [], today)).toEqual({ earned: 0, max: 0, pct: 0 });
  });
});

describe("habit analytics — stats & trend", () => {
  const habit = { id: "h1", points: 10 };
  const log = (date, value = 100) => ({ id: `l${++seq}`, habitId: "h1", date, value });

  it("habitStats counts done days, rate, and avg level over the window", () => {
    // today = 2026-07-11; done on 11, 10, and a 50% on 9 → 3 of 10 days
    const logs = [log("2026-07-11"), log("2026-07-10"), log("2026-07-09", 50)];
    const s = habitStats(habit, logs, 10);
    expect(s.done).toBe(3);
    expect(s.total).toBe(10);
    expect(s.rate).toBe(30);
    expect(s.avgLevel).toBe(83); // (100+100+50)/3 rounded
    expect(s.days).toHaveLength(10);
  });

  it("habitTrend is positive when the recent half beats the earlier half", () => {
    // n=8 → older = days 4 back..7 back, recent = today..3 back
    const logs = [
      log("2026-07-11"),
      log("2026-07-10"),
      log("2026-07-09"), // recent: 3 of 4
      log("2026-07-05"), // older: 1 of 4
    ];
    const t = habitTrend(habit, logs, 8);
    expect(t.recentRate).toBe(75);
    expect(t.prevRate).toBe(25);
    expect(t.delta).toBe(50);
  });
});
