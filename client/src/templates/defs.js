// BA learning-template definitions — reference material, viewed read-only in
// the Templates tab with a complete worked example (Banyan ATS).
//
// HOW TO ADD A NEW TEMPLATE
// 1. Copy the "problem-statement" object below as a starting shape.
// 2. Give it a unique `id`, the next `code` number, and `status: "ready"`.
//    (If a planned placeholder with the same id exists below, replace it.)
// 3. Fill `howToUse` (bullet list), `meta` (document-control fields with an
//    `exampleMeta` value for each), and `sections` — one entry per section
//    with: key, num, title, guidance, prompts (optional), placeholder (what a
//    blank copy would say), and `example` (the worked Banyan ATS content).
// 4. Rebuild (`npm run build`) — the library card appears automatically.
// Tip: paste an exported template's text to Claude and ask it to convert the
// content into this shape.

export const TEMPLATES = [
  {
    id: "problem-statement",
    code: "01",
    status: "ready",
    title: "Problem Statement",
    tagline:
      "Define what problem is being solved and for whom, before any feature or technology. The first BA artifact.",
    tags: ["discovery", "scoping"],
    howToUse: [
      "Fill each section in order; if one stalls, skip it and return — sections 1 and 4 usually unlock the rest.",
      "Write from real observation and specific incidents, not general truths. “Our team once lost a good hire because nobody replied for two weeks” beats “hiring is inefficient.”",
      "Section 7 (out of scope) is as important as the rest: deciding what NOT to build is what keeps a first version finishable.",
      "Read the guidance while learning; expect two or three review passes — that is normal, not failure.",
    ],
    meta: [
      { key: "project", label: "Project / Product", placeholder: "e.g. Banyan ATS" },
      { key: "author", label: "Author", placeholder: "who wrote this" },
      { key: "date", label: "Date", placeholder: "YYYY-MM-DD" },
      { key: "version", label: "Version", placeholder: "v0.1 (draft), v1.0 (agreed) …" },
      { key: "status", label: "Status", placeholder: "Draft / In review / Approved" },
    ],
    exampleMeta: {
      project: "Banyan ATS",
      author: "BA learner (you)",
      date: "2026-07-06",
      version: "v0.1 (draft)",
      status: "Draft",
    },
    sections: [
      {
        key: "problem",
        num: 1,
        title: "The problem",
        guidance:
          "In 3–5 sentences: what goes wrong today, for the people you are building for? Each sentence should carry ONE failure.",
        prompts:
          "Where does the work land today (email? spreadsheet? chat?)? Who loses track of what? What happens when the one person holding it all is away? How does the end user experience the failure?",
        placeholder: "Your problem statement here — 3 to 5 sentences.",
        example:
          "When a small company hires without a dedicated tool, applications arrive scattered across email inboxes, WhatsApp chats, and job-portal messages — there is no single place where anyone can see every candidate for a role. Under time pressure the whole process is often compressed into a single day of walk-in interviews ending in same-day offers, with necessary stages skipped along the way; steps that cannot be rushed, like certificate verification with a university, take unpredictable time that nobody tracks. HR and management have no shared view of who applied, who was called, or who decided what — the hiring status lives in one person’s head or spreadsheet. Candidates experience the disorder directly: hours of waiting on interview day, and silence afterwards.",
      },
      {
        key: "pain",
        num: 2,
        title: "Who feels the pain",
        guidance:
          "One line of specific pain per role — real people, not “users.” Name each role and the single thing that hurts them most.",
        prompts:
          "Who decides? Who does the day-to-day tracking? Who is pulled in occasionally? Who waits on the outcome?",
        placeholder: "One line of pain per role — who decides, who tracks, who waits.",
        example:
          "The founder / director — hires rarely but urgently, and personally absorbs the cost of a wrong hire; in a startup, one bad selection is money the company cannot recover.\n\nThe HR / office manager — tracks every candidate in a private spreadsheet, chases panel members and universities by phone, and becomes a single point of failure; where trust is thin, the lack of a shared record turns into suspicion and politics.\n\nThe interview panel member / department head — pulled in ad hoc around their real job; their availability silently dictates the entire recruitment schedule, because nothing can move without the expert in the room.\n\nThe candidate — waits hours on interview day, then refreshes an inbox that never rings; they judge the whole company by the disorder of its hiring.",
      },
      {
        key: "cost",
        num: 3,
        title: "The cost of the problem",
        guidance:
          "Why does this deserve software? Estimate honestly, one line per cost: wasted money, lost time, lost opportunities, damage that outlasts the event.",
        prompts: "",
        placeholder: "One line per cost — money, time, opportunity, lasting damage.",
        example:
          "A mis-hire costs 4–6 months of salary with no fruitful return, plus the full cost of running the hiring round again.\n\nIn education, the cost compounds into reputation: a wrong teaching hire shows up in student results and placement outcomes — damage that outlasts the employee.\n\nRepeated ad hoc hiring has a hidden cost: someone senior must run product training for every replacement, effectively dedicating a trainer the startup cannot afford to lose.\n\nSlow, uncoordinated processes lose the best candidates, who accept faster offers elsewhere while the panel’s calendars are being aligned.",
      },
      {
        key: "alternatives",
        num: 4,
        title: "How they cope today (current alternatives)",
        guidance:
          "What do people use right now, and why does each option break down? Cover both the cheap/manual tools AND the expensive/heavy ones, so the gap your product fills is visible.",
        prompts: "Where does a non-standard need fall through the cracks of the generic tools?",
        placeholder: "Cheap/manual tools and heavy/expensive ones — and why each breaks down.",
        example:
          "Today the work is done with shared inboxes, Excel sheets, and Google Forms. These hold data but give nothing back: no analytics or insight into how hiring is going, no collaboration — the spreadsheet is one person’s private tool, invisible to management and panel members — and no traceable history of who moved which candidate, when, and why. When the person who owns the sheet is on leave, hiring stops.\n\nAt the other extreme, enterprise ATSs (Workday, Greenhouse and the like) are priced and designed for companies with dedicated HR departments: they demand formal implementation, ongoing administration, and HR expertise that a 20-person company does not have. At small hiring volumes, the cost cannot justify the returns.\n\nAnd even where a generic tool is affordable, it is rigid: a school’s demo class, a sales team’s role-play call, a startup founder’s culture conversation has no place in a fixed pipeline. Companies end up bending their hiring process to fit the tool — the opposite of what a tool is for.",
      },
      {
        key: "vision",
        num: 5,
        title: "The vision",
        guidance:
          "2–3 sentences describing the world after your product exists. Written for the customer, not a developer — outcomes only, no feature names, no technical words. The vision must stand on its own without any “AI” or buzzwords propping it up.",
        prompts: "",
        placeholder: "2–3 sentences — outcomes only, written for the customer.",
        example:
          "Banyan ATS gives a small or growing company one place where hiring runs in the open: every vacancy, every candidate, and every decision visible to everyone involved, from founder to panel member. Each job runs its own pipeline shaped to how that role is really hired — a coding test for a developer, a demo class for a teacher — so the company’s process fits the company, not the tool. Hiring becomes swift for the team, transparent for management, and respectful for the candidate.\n\n(Later versions add AI assistance on top of this foundation; the vision above must stand on its own without it.)",
      },
      {
        key: "success",
        num: 6,
        title: "What success looks like (this version)",
        guidance:
          "3–5 TESTABLE statements — things someone could mark pass or fail. Describe outcomes, not features: “anyone can answer where a candidate is in under 10 seconds”, not “has a kanban board.” These become the yardstick for every later scoping decision.",
        prompts: "",
        placeholder: "3–5 testable pass/fail statements — outcomes, not features.",
        example:
          "A company can go from posting a vacancy to recording an offer decision entirely inside the system — no step of the flow requires falling back to email or Excel.\n\nEvery application submitted against a posted job lands directly in that job’s pipeline — no application exists only in someone’s personal inbox.\n\nBefore opening a job, an admin can shape its pipeline — add, remove, rename, and reorder stages — so two different jobs can run two different processes.\n\nAnyone with access can answer “where is candidate X, and whose action is next?” in under 10 seconds from a board view of the pipeline.\n\nEvery stage move is recorded with who and when, so any candidate’s full journey can be reconstructed after the fact.",
      },
      {
        key: "scope",
        num: 7,
        title: "Explicitly out of scope (for now)",
        guidance:
          "List what you are deliberately NOT building yet, grouped as: IN this version, DEFERRED to a later version, and OUT entirely. Must not contradict section 6. Every item you push out is a promise that this version will actually ship.",
        prompts: "",
        placeholder: "Group as IN this version · DEFERRED · OUT entirely.",
        example:
          "DECIDED IN V1\nPipeline configurability (add/remove/rename/reorder stages per job) — it is the product’s differentiator, so it cannot wait. Limited strictly to stage structure: no per-stage automation rules, triggers, or approvals in v1. Each job gets a shareable public application link (otherwise nothing can enter the pipeline), but that is a form, not a job board.\n\nDEFERRED TO V1.5 / V2\nEmail notifications to candidates and panel members (v1: status is visible in the system; nobody is notified automatically). Automated recruiter assignment. Assessments / tests: configuration, delivery, and scoring. Certificate / document verification workflow. A public careers page / job board.\n\nOUT ENTIRELY (THIS PRODUCT CYCLE)\nPayroll and onboarding. Background checks performed by the system itself. Resume search across companies. Multi-language UI. All AI features — resume parsing, matching, summarization — reserved by design for the final phase of this project.",
      },
      {
        key: "signoff",
        num: 8,
        title: "Sign-off",
        guidance:
          "Optional: who reviewed and agreed this statement, and when. Turns a draft into a shared commitment.",
        prompts: "",
        placeholder: "Reviewer (name & role) and date agreed.",
        example: "",
      },
    ],
  },
  {
    id: "stakeholders-personas",
    code: "02",
    status: "ready",
    title: "Stakeholders & Personas",
    tagline:
      "Define WHO cares about the system (stakeholders) and WHO actually uses it (personas) — the second BA artifact, right after the problem statement.",
    tags: ["discovery", "users"],
    howToUse: [
      "Fill Part A first (wide net — everyone who cares), then Part B for only the rows marked as users, then Part C last.",
      "Personas must come from real observation, not invented demographics. Give each a name and one TELLING DETAIL — a specific human thing that makes design decisions concrete.",
      "If two personas share goals and frustrations, they are one persona, not two — usually 3–4 personas is enough.",
      "Keep the guidance while learning; delete it once each section has real content.",
    ],
    meta: [
      { key: "project", label: "Project / Product", placeholder: "e.g. Banyan ATS" },
      { key: "author", label: "Author", placeholder: "who wrote this" },
      { key: "date", label: "Date", placeholder: "YYYY-MM-DD" },
      { key: "version", label: "Version", placeholder: "v0.1 (draft), v1.0 (agreed) …" },
      { key: "status", label: "Status", placeholder: "Draft / In review / Approved" },
    ],
    exampleMeta: {
      project: "Banyan ATS",
      author: "Dhilip",
      date: "2026-07-15",
      version: "v0.3 (revised)",
      status: "Revised — Hiring Manager role clarified",
    },
    sections: [
      {
        key: "keyIdea",
        num: 1,
        title: "Key idea",
        guidance:
          "A STAKEHOLDER is anyone who cares about the system (affected by it, funds it, constrains it, judges it). A USER is the narrower group who actually touches the software. Every user is a stakeholder; not every stakeholder is a user.",
        prompts: "",
        placeholder:
          "Part A lists everyone — wide and shallow. Part B goes deep only on the people who actually use it.",
        example:
          "A stakeholder is anyone who cares about the system (affected by it, funds it, constrains it, judges it). A user is the narrower group who actually touches the software. Every user is a stakeholder; not every stakeholder is a user.\n\nPart A lists everyone (wide and shallow); Part B goes deep on only the people who actually use it.",
      },
      {
        key: "stakeholderRegister",
        num: 2,
        title: "Part A — Stakeholder register",
        guidance:
          "Everyone who cares, whether or not they log in. Influence = High / Medium / Low. The \"Is a user?\" column is the hinge — it decides who gets a persona in Part B.",
        prompts: "Aim for 6–9 rows. Influence and the user column are colour-coded so the register is scannable at a glance.",
        placeholder: "e.g. Company founder — fast, correct hires; value for money — High — Rarely",
        example:
          "Each row: Stakeholder — main interest — Influence — Is a user?\n\n" +
          "Founder / co-founders — Fast, correct hires; value for money — High — Rarely (views summary reports only)\n" +
          "Director — Correct hires; reviews recruitment reports — High — Rarely\n" +
          "Department Head — Approves requisitions raised by Hiring Managers; wants the right skillset for a vacancy — High — Rarely (approval step only)\n" +
          "HR Manager (Admin) — Configure and oversee the whole flow; publish jobs; assign candidates to recruiters; approve key stages — High — Core user\n" +
          "Hiring Manager — Raise job requisition (needs Department Head approval); create JD; sit on the interview panel for the round(s) assigned to him; own the hiring decision — High — Core user\n" +
          "HR Executive / Recruiter — Work the board daily; move candidates; schedule; communicate — Medium — Core user\n" +
          "Panel Member — Interview and score candidates for a specific round (internal, incl. Hiring Manager, or external expert) — Medium — Limited (scorecard entry page only)\n" +
          "Candidate — Apply; track progress; (later) self-schedule — Low — Limited (application form)\n" +
          "Employee Referrer — Refer known candidates; referral bonus — Low — Limited (referral page, later version)\n" +
          "Accounts / Finance — Salary budget for open roles — Low — Not a user\n" +
          "Background Verification Team — Verify certificates of hired candidates — Low — Not a user (Recruiter records the outcome)\n" +
          "3rd-party Assessment Team — Conduct written / mass assessments — Low — Not a user\n\n" +
          "Resolved contradiction — Background Verification Team: they do not type into Banyan in v1; the Recruiter records their outcome. That keeps them a stakeholder, not a user. (Integrating them directly is a later-version decision.)\n\n" +
          "Resolved overlap — Hiring Manager vs. Panel Member: a job can have several interview rounds, each with its own panel. The Hiring Manager is ONE specific panel member — assigned to whichever round(s) he's best suited to judge — not a separate interviewing mechanism. Other rounds can carry other internal staff or external experts; same scorecard mechanism for everyone.\n\n" +
          "Resolved overlap — Department Head vs. Hiring Manager: two different people. The Hiring Manager (Mani) raises the requisition and runs day-to-day hiring for his team; the Department Head sits above him and only touches the system to APPROVE the requisition — a single gate, not ongoing involvement.\n\n" +
          "Why this matters: the rows marked Core user are the ones that earn a full persona in Part B. Everyone else is satisfied through features and reports, not screens designed for them.",
      },
      {
        key: "personas",
        num: 3,
        title: "Part B — Personas",
        guidance:
          "One card per person who ACTUALLY uses the system (usually 3–4). Draw on real people. If two personas share goals and frustrations, they are one persona, not two.",
        prompts:
          "Personas must come from real observation, not invented demographics. Give each a name and one TELLING DETAIL — a specific human thing that makes design decisions concrete.",
        placeholder:
          "[ Name ] — [ role ]\nSnapshot: age-ish, context, how technical, how often they hire.\nIn the process, they: what they actually do — post? screen? interview? decide?\nGoals: goal 1. goal 2.\nFrustrations today: frustration 1. frustration 2.\nNeeds from the system: need 1 (outcome, not feature). need 2.\nTelling detail: ONE specific human thing — a habit, a fear, a workaround. The highest-value line.\n\nRepeat for each persona (usually 3–4).",
        example:
          "Arthi — HR Manager (Admin)\n" +
          "Snapshot: HR Manager at a ~100-employee firm; comfortable with software; owns the hiring system end to end.\n" +
          "In the process, they: hold all permissions; create job openings from department requirements; design each job's process (stages + scoring) with the department head and leadership; assign whole jobs or individual candidates to recruiters; co-ordinate with hiring managers to create the JD and recruitment stages; use override permission to resolve discrepancies; export reports for the director and founders.\n" +
          "Goals: a well-defined, consistent process for every job; live visibility of progress.\n" +
          "Frustrations today: candidates apply through several HRs at once, with no single place to see them all; every job needs a different flow, but rushing it all into one day causes poor selection.\n" +
          "Needs from the system: a predefined flow (stages + scoring) attached to each job at posting time; progress reports and automation wherever possible.\n" +
          "Telling detail: she has been burned by two recruiters unknowingly chasing the same candidate, so she instinctively wants to see everything herself — making her the bottleneck she resents being.\n\n" +
          "Mani — Hiring Manager\n" +
          "Snapshot: department-side manager who raises requisitions and is accountable for filling his department's roles; not an ATS administrator.\n" +
          "In the process, they: raise a job requisition to the HR Manager, pending the Department Head's approval; create the JD; get assigned by Admin as the panel member for the interview round(s) he's best placed to judge (one job may have several rounds, with other internal staff or external experts on the rest); own the final hiring decision for his requisitions.\n" +
          "Goals: a quick, low-friction requisition-and-approval flow; being pulled in only for the round(s) that need him; visibility into how his department's pipeline is progressing.\n" +
          "Frustrations today: missing out on a strong candidate because he wasn't available on the day his interview round was needed.\n" +
          "Needs from the system: a simple requisition + JD flow with visible approval status; a clear notice of exactly which round(s) he owns; a fast way to submit his interview decision so it never becomes the bottleneck.\n" +
          "Telling detail: Mani lives in back-to-back meetings; his real fear is that a strong candidate goes cold while he's away from his desk — so he wants the system to nudge him the moment HIS round or HIS decision is the thing holding a candidate up.\n\n" +
          "Rachel — Recruiter (HR Executive)\n" +
          "Snapshot: executes day-to-day recruitment; lives in the board.\n" +
          "In the process, they: enter scores at each stage; move candidates between stages; manually record outcomes from assessment and background-verification teams; email candidates and panel members; build schedules, create slots, allocate panel members.\n" +
          "Goals: move candidates stage by stage and complete the process cleanly.\n" +
          "Frustrations today: tracking every candidate in Excel is hard; each recruiter keeps their own data, so coordination is painful.\n" +
          "Needs from the system: a smooth interface to move candidates through stages; less dependence on managers via a preset flow; easy scheduling and communication.\n" +
          "Telling detail: Rachel is often the scapegoat when an unplanned process goes wrong for a candidate or the team — so she wants the process visible and enforced, to share the accountability rather than carry it alone.\n\n" +
          "Cathy — Candidate\n" +
          "Snapshot: applies expecting a clear JD, a seamless application, visibility of the major stages, and no unnecessary waiting.\n" +
          "In the process, they: apply via web portal (or hard copy); fill the form; upload documents; (later version) self-schedule interview slots; move through each stage; accept the offer.\n" +
          "Goals: a smooth process with zero unnecessary waiting; clear communication and hassle-free scheduling.\n" +
          "Frustrations today: made to wait for hours because interview planning is poor.\n" +
          "Needs from the system: an application portal and two-way communication; (later) self-scheduling — especially for candidates travelling a distance.\n" +
          "Telling detail: Cathy once lost a whole day to a disorganized, uncommunicative process — with no clear schedule she couldn't plan her travel, and she now judges a company's professionalism by how it runs its hiring.\n" +
          "v1 scope note: in v1 she is a user of ONE screen — the application form (apply + upload). Self-scheduling and online offer acceptance are deferred to a later version (see problem statement §7).",
      },
      {
        key: "implications",
        num: 4,
        title: "Part C — What this tells us (design implications)",
        guidance:
          "Fill last. This is where the artifact earns its keep — it should change what you build.",
        prompts: "",
        placeholder:
          "Primary persona (optimise for first): who, and WHY — think frequency & centrality of use, not who has most permissions.\nA stakeholder who is NOT a user but must be satisfied: who, and how — a report? a guarantee?\nWhat writing this surfaced: one thing a persona needs that you'd have missed otherwise.",
        example:
          "Primary persona (optimise for first): Admin (Arthi). Admin and Recruiter share the same core board; Admin is a superset with extra config/override screens. Optimise the shared board for the high-frequency daily flow, and keep admin-only controls on separate screens so the board stays fast. (Watch: don't let override controls clutter the daily board.)\n\n" +
          "A stakeholder who is NOT a user but must be satisfied: the Founder. A mis-hire costs 3–6 months of salary plus training. Satisfy through a transparent report: recruitment funnel, filtering steps, candidate–JD match, and time-to-hire.\n\n" +
          "What writing this surfaced: the three internal personas map onto three distinct roles with distinct permission sets — Admin, Hiring Manager, Recruiter — not a strict nested hierarchy (Hiring Manager is narrow-scope, not a sub-Admin). In other words, the product needs Role-Based Access Control (RBAC). We discovered a standard design pattern by profiling real people, not by copying a template.",
      },
    ],
  },
  {
    id: "business-requirements",
    code: "03",
    status: "planned",
    title: "Business Requirements",
    tagline: "The BRD: turning an agreed problem into what the business needs the solution to do.",
  },
  {
    id: "user-stories",
    code: "04",
    status: "planned",
    title: "User Stories & Acceptance",
    tagline: "Small, testable slices of need with clear pass/fail acceptance criteria.",
  },
  {
    id: "process-flow",
    code: "05",
    status: "planned",
    title: "Process Flow (As-Is / To-Be)",
    tagline: "Map how work happens today and how it should happen once the solution exists.",
  },
];

export const templateById = (id) => TEMPLATES.find((t) => t.id === id);
