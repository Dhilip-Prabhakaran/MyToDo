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
      author: "BA learner (you)",
      date: "2026-07-07",
      version: "v0.1 (draft)",
      status: "Draft",
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
        example: "",
      },
      {
        key: "stakeholderRegister",
        num: 2,
        title: "Part A — Stakeholder register",
        guidance:
          "Everyone who cares, whether or not they log in. Influence = High / Medium / Low. The \"Is a user?\" column is the hinge — it decides who gets a persona in Part B.",
        prompts: "Aim for 6–9 rows. Influence and the user column are colour-coded so the register is scannable at a glance.",
        placeholder: "e.g. Company founder — fast, correct hires; value for money — High — Rarely",
        exampleTable: {
          columns: [
            { label: "Stakeholder" },
            { label: "Main interest" },
            { label: "Influence", badge: "influence" },
            { label: "Is a user?", badge: "user" },
          ],
          rows: [
            ["Founder / co-founders", "Fast, correct hires; value for money", "High", "Rarely — reports only"],
            ["Director", "Correct hires; reviews recruitment reports", "High", "Rarely"],
            ["Department Head", "A candidate with the right skillset for a vacancy", "High", "Rarely"],
            ["HR Manager (Admin)", "Configure & oversee the whole flow; records & logs", "High", "Core user"],
            ["Hiring Manager", "Publish jobs; assign candidates; approve key stages", "High", "Core user"],
            ["HR Executive / Recruiter", "Work the board daily; move candidates; schedule", "Medium", "Core user"],
            ["Panel Member", "Interview and score candidates", "Medium", "Limited — scorecard only"],
            ["Candidate", "Apply; track progress; (later) self-schedule", "Low", "Limited — application form"],
            ["Employee Referrer", "Refer known candidates; referral bonus", "Low", "Limited — referral (later)"],
            ["Accounts / Finance", "Salary budget for open roles", "Low", "Not a user"],
            ["Background Verification Team", "Verify certificates of hired candidates", "Low", "Not a user"],
            ["3rd-party Assessment Team", "Conduct written / mass assessments", "Low", "Not a user"],
          ],
        },
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
        exampleCards: [
          {
            title: "Arthi",
            subtitle: "HR Manager (Admin)",
            fields: [
              { label: "Snapshot", text: "HR Manager at a ~100-employee firm; comfortable with software; owns the hiring system end to end." },
              { label: "In the process, they", text: "Hold all permissions; create job openings from department needs; design each job's process (stages + scoring) with leadership; assign whole jobs or candidates to hiring managers; use override permission to resolve discrepancies; export reports for the director and founders." },
              { label: "Goals", items: ["A well-defined, consistent process for every job", "Live visibility of progress"] },
              { label: "Frustrations today", items: ["Candidates apply through several HRs at once — no single view", "Rushing every job's flow into one day causes poor selection"] },
              { label: "Needs from the system", items: ["A predefined flow (stages + scoring) attached to each job at posting time", "Progress reports and automation wherever possible"] },
              { label: "Telling detail", text: "She has been burned by two recruiters unknowingly chasing the same candidate, so she instinctively wants to see everything herself — making her the bottleneck she resents being.", highlight: true },
            ],
          },
          {
            title: "Mani",
            subtitle: "Hiring Manager",
            fields: [
              { label: "Snapshot", text: "Manages a team of recruiters; accountable for filling his department's roles." },
              { label: "In the process, they", text: "Assign candidates to recruiters; approve candidates at key stages; form interview / demo / group-discussion panels; invite panel members with schedules; balance recruiter workloads." },
              { label: "Goals", items: ["Smoothly monitor recruitment", "Balance his team's workload"] },
              { label: "Frustrations today", items: ["Hard to centralize and follow different processes for different jobs at once"] },
              { label: "Needs from the system", items: ["A clear workflow and automation to manage workloads", "Live monitoring of recruiter activity"] },
              { label: "Telling detail", text: "Mani lives in back-to-back meetings; his real fear is a strong candidate going cold while he's away from his desk — so he wants the system to nudge him when his approval is the hold-up.", highlight: true },
            ],
          },
          {
            title: "Rachel",
            subtitle: "Recruiter (HR Executive)",
            fields: [
              { label: "Snapshot", text: "Executes day-to-day recruitment; lives in the board." },
              { label: "In the process, they", text: "Enter scores at each stage; move candidates between stages; manually record outcomes from assessment and background-verification teams; email candidates and panel members; build schedules, create slots, allocate panel members." },
              { label: "Goals", items: ["Move candidates stage by stage", "Complete the process cleanly"] },
              { label: "Frustrations today", items: ["Tracking every candidate in Excel is hard", "Each recruiter keeps their own data; coordination is painful"] },
              { label: "Needs from the system", items: ["A smooth interface to move candidates through stages", "Less dependence on managers via a preset flow", "Easy scheduling and communication"] },
              { label: "Telling detail", text: "Rachel is often the scapegoat when an unplanned process goes wrong — so she wants the process visible and enforced, to share accountability rather than carry it alone.", highlight: true },
            ],
          },
          {
            title: "Cathy",
            subtitle: "Candidate",
            fields: [
              { label: "Snapshot", text: "Applies expecting a clear JD, a seamless application, visibility of the major stages, and no unnecessary waiting." },
              { label: "In the process, they", text: "Apply via web portal (or hard copy); fill the form; upload documents; (later) self-schedule slots; move through each stage; accept the offer." },
              { label: "Goals", items: ["Zero unnecessary waiting", "Clear communication and hassle-free scheduling"] },
              { label: "Frustrations today", items: ["Made to wait for hours because interview planning is poor"] },
              { label: "Needs from the system", items: ["An application portal and two-way communication", "(Later) self-scheduling for distant candidates"] },
              { label: "Telling detail", text: "Cathy once lost a whole day to a disorganized, uncommunicative process; with no clear schedule she couldn't plan her travel, and now judges a company by how it runs its hiring.", highlight: true },
            ],
          },
        ],
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
        exampleCards: [
          {
            fields: [
              { label: "Primary persona (optimise for first)", text: "Admin (Arthi). Admin and Recruiter share the same core board; Admin is a superset with extra config/override screens. Optimise the shared board for the high-frequency daily flow, and keep admin-only controls on separate screens so the board stays fast. (Watch: don't let override controls clutter the daily board.)" },
              { label: "A stakeholder who is NOT a user but must be satisfied", text: "The Founder. A mis-hire costs 3–6 months of salary plus training. Satisfy through a transparent report: recruitment funnel, filtering steps, candidate–JD match, and time-to-hire." },
              { label: "What writing this surfaced", text: "The three internal personas map onto three permission tiers — Admin / Hiring Manager / Recruiter. The product needs Role-Based Access Control (RBAC), discovered by profiling real people.", highlight: true },
            ],
          },
        ],
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
