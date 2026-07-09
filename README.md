# MyToDo ✨

A colorful personal goal tracker: set big **Targets**, break them into
**Milestones**, and grind small **daily subtasks** — with reports that show
your daily completion %, whether each milestone is on pace, and your streak.

Built for a 9-month upskilling plan, useful for any long-running goal.

## Stack

| Layer    | Tech                                                        |
| -------- | ----------------------------------------------------------- |
| Frontend | React 19 + Vite (plain CSS, hand-rolled SVG charts)         |
| Backend  | Node.js + Express                                            |
| Database | MongoDB when `MONGODB_URI` is set, else local JSON file      |

The storage layer is isolated in `server/db.js` behind `initDb` / `load` /
`save`. With no `MONGODB_URI` it uses `server/data/db.json` (zero setup, great
for local dev). Set `MONGODB_URI` (e.g. a MongoDB Atlas connection string) and
it stores the same state in MongoDB instead — durable across redeploys. The
server logs which backend it chose on startup.

## Concepts

- **Target** — the big goal (e.g. "Master Gen AI"), with a start and target date and a color.
- **Milestone** — a chunk of the target with its own start/due date.
- **Subtask** — a small task scheduled on a specific day. Use "repeat N days" to
  create a daily habit run in one go. Add them under a milestone or directly in
  the **Planner** calendar. Drag across days in the calendar to pick a range,
  then choose: **one task spanning the range** (a single deliverable, done once)
  or **repeat daily** (a separate task each day).
- **Day window** — a "day" runs **6:00 AM → 5:59 AM** the next morning, so
  late-night work still counts toward the previous day
  (`DAY_START_HOUR` in `client/src/insights.js`).
- **Templates** — a read-only BA learning library. Each template is a
  guidance-annotated worksheet shown with its complete worked example
  (Banyan ATS). Definitions live in `client/src/templates/defs.js` — the top
  of that file has the recipe for adding a new template (copy the
  problem-statement shape, fill sections, rebuild).

## Reports

- **Today ring** — % of today's tasks done, streak counter.
- **Last 14 days** — bar chart of daily completion (gold bar = perfect day).
- **Milestone pace** — actual completion vs. *expected* completion, where
  expected assumes even progress from the milestone's start to its due date.
  On track / behind / overdue at a glance.
- **Target rings** — overall completion per target with days remaining.

## Run locally

```bash
npm install          # root tooling (concurrently)
npm run install-all  # server + client deps
npm run dev          # server on :4000, client on :5175
```

Open http://localhost:5175. (5175 avoids clashing with the ATS Docker stack on 5173.)

To test the MongoDB backend locally, point it at any MongoDB and run with an
env file (Node 20.6+):

```bash
node --env-file=.env server/server.js   # after copying .env.example → .env
```

## Production / deployment

```bash
npm run build   # builds client into client/dist
npm start       # Express serves the API *and* the built frontend on :4000
```

Deploys as a single Node web service. A `render.yaml` is included for
[Render](https://render.com)'s free tier:

- **Build command:** `npm run install-all && npm run build`
- **Start command:** `npm start`

**Durable storage (recommended for real use).** Free hosts have an *ephemeral
disk*, so the JSON file resets on every redeploy. Use free
[MongoDB Atlas](https://www.mongodb.com/atlas) instead:

1. Create a free **M0** cluster, a database user, and allow network access
   from `0.0.0.0/0` (Render's IPs aren't fixed on the free tier).
2. Copy the connection string (`mongodb+srv://…`).
3. In Render → your service → **Environment**, set `MONGODB_URI` to it.
4. Redeploy. The startup log should read `storage: MongoDB (db: mytodo)`.

Without `MONGODB_URI` the app still runs — it just uses the ephemeral JSON file.

## API (all JSON, under `/api`)

```
GET    /api/state
POST   /api/targets                       {title, description?, color?, startDate, targetDate}
PUT    /api/targets/:id
DELETE /api/targets/:id                   (cascades)
POST   /api/targets/:id/milestones        {title, startDate?, dueDate}
PUT    /api/targets/:id/milestones/order  {ids: [...]} — drag-reorder
PUT    /api/milestones/:id
DELETE /api/milestones/:id                (cascades)
POST   /api/milestones/:id/subtasks       {title, date, repeatDays?, endDate?, mode?: single|daily}
PUT    /api/subtasks/:id                  {done?, title?, date?}
DELETE /api/subtasks/:id
```
