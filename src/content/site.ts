/**
 * Site-wide identity & contact content.
 * All copy edits happen here — never inside components.
 * TODO(vishesh): items marked TODO await your INTAKE answers.
 */

export const identity = {
  name: "Vishesh Jain",
  role: "AI-Native Engineer",
  // TODO(vishesh): confirm headline (INTAKE §A)
  headline: ["Systems", "that think."],
  sub: "I design and build software where the intelligence isn't bolted on — it's the architecture. Agents, automation, and pipelines that reason, recover, and run themselves.",
  availability: "Open to roles — 2026",
  location: "India", // TODO(vishesh): city (INTAKE §A)
};

export const contact = {
  email: "visheshjain353@gmail.com",
  linkedin: "https://www.linkedin.com/in/vishesh-jain-2aaa49297/",
  github: "https://github.com/VisheshJain21",
  instagram: "https://www.instagram.com/vishesh_353/",
  phone: "+916262444559",
  phoneDisplay: "+91 62624 44559",
  // TODO(vishesh): drop your CV PDF at public/vishesh-jain-resume.pdf
  resume: "/vishesh-jain-resume.pdf",
};

// About — the factual "who is this" (distinct from the poetic Manifesto).
// TODO(vishesh): replace bio + chips with your own words (INTAKE §B).
export const about = {
  eyebrow: "About",
  heading: ["Engineer first.", "AI-native by", "instinct."],
  bio: [
    "I'm an AI-native engineer who builds software that thinks for itself — autonomous agents, self-healing pipelines, and automation that survives contact with the real world.",
    "My work runs in production, not just notebooks: a 4-channel messaging platform with a self-monitoring agent team, an AI-vision automation tool engineered fail-closed for a live enterprise portal, and open-source tools like OpenClaw that debug code end-to-end.",
  ],
  // Engineering-flavored personality (our voice — not borrowed).
  facts: [
    "Ships to production",
    "Agents over scripts",
    "Fails closed, by design",
    "Reads the stack trace",
  ],
};

// Experience — real work history. Sanitized where employer-confidential.
// TODO(vishesh): confirm exact titles/dates (INTAKE §B).
export const experience = [
  {
    role: "AI-Native Engineer — Intern",
    org: "Fintech (production systems)",
    period: "2025 — Present",
    body: "Build and ship production AI/automation systems used by field teams: a four-channel notification platform with an autonomous self-healing agent layer, and a safety-critical, AI-vision ops-automation tool with full audit trails.",
    tags: ["Python", "FastAPI", "LLM agents", "Automation", "Production"],
    confidential: true,
  },
  {
    role: "Independent / Open Source",
    org: "Self-directed",
    period: "Ongoing",
    body: "Design and release my own systems — OpenClaw, an autonomous multi-agent debugger, and NEXUS, a full-stack workforce-intelligence platform — to push how far autonomy and AI-native architecture can go.",
    tags: ["Multi-agent", "Full-stack", "WebSockets", "Docker"],
  },
];

export const manifesto = {
  eyebrow: "Manifesto",
  // Scroll-highlighted statement. TODO(vishesh): replace with your own voice (INTAKE §B)
  text: "Most software waits for instructions. I build systems that don't — agents that watch, decide, recover, and finish the job. AI isn't a feature I add at the end. It is the first line of the architecture.",
};

export const processSteps = [
  {
    title: "Frame the system",
    body: "Before any code: what runs itself, what needs a human, what must never fail. The boundaries are the design.",
  },
  {
    title: "Design the agent loop",
    body: "Observe → reason → act → verify. Every autonomous system I build earns trust through checkable steps, not magic.",
  },
  {
    title: "Build & instrument",
    body: "Ship the pipeline with eyes built in — logs, audits, screenshots, state machines. If it can't be inspected, it doesn't exist.",
  },
  {
    title: "Harden for production",
    body: "Failovers, retries where safe, hard stops where not. Tested until boring, then deployed to run without me.",
  },
];

// Signature "Proof, not promises" stat band — real numbers pulled from
// the project set (SOP: numbers win). TODO(vishesh): swap in any better stats.
export const proofStats = [
  { value: "04", unit: "", label: "Systems shipped" },
  { value: "948", unit: "", label: "Tests green on the flagship" },
  { value: "4", unit: "×", label: "Failover channels, one platform" },
  { value: "0", unit: "", label: "Retries allowed — fail-closed by design" },
];

// Categorized tech stack. `level` (0–100) sets bar width — a depth
// signal, shown WITHOUT loud numbers to avoid the arbitrary "95%" look.
// TODO(vishesh): confirm skills & levels (INTAKE §D).
export const techStack: { group: string; skills: { name: string; level: number }[] }[] = [
  {
    group: "Languages",
    skills: [
      { name: "Python", level: 95 },
      { name: "TypeScript / JS", level: 82 },
      { name: "SQL", level: 85 },
      { name: "PHP", level: 70 },
    ],
  },
  {
    group: "AI & ML",
    skills: [
      { name: "LLM agents & orchestration", level: 92 },
      { name: "Prompt engineering", level: 88 },
      { name: "AI vision", level: 80 },
      { name: "RAG / retrieval", level: 78 },
    ],
  },
  {
    group: "Backend & Infra",
    skills: [
      { name: "FastAPI", level: 90 },
      { name: "Node.js", level: 80 },
      { name: "Docker", level: 78 },
      { name: "nginx · systemd", level: 75 },
    ],
  },
  {
    group: "Tools & Data",
    skills: [
      { name: "Playwright · Selenium", level: 88 },
      { name: "SQLite · SQL", level: 85 },
      { name: "Git", level: 90 },
      { name: "REST / WebSockets", level: 82 },
    ],
  },
];

// Slim ambient marquee kept beneath the categorized grid.
export const capabilities = {
  marquee: [
    "Multi-agent pipelines",
    "Self-healing systems",
    "Test-driven",
    "Production deploys",
    "Browser automation",
    "Zoho · Meta APIs",
    "React · Next.js",
    "Shader / WebGL",
  ],
};
