/**
 * Selected Systems — the featured project data.
 * Order: strongest first, alternating public ↔ sanitized (SOP §7.2).
 * Employer projects are deliberately abstracted: no company/bank names,
 * no internal specifics beyond what the user approved.
 * TODO(vishesh): metrics/outcomes + screenshots per INTAKE §C.
 */

export type Project = {
  index: string;
  title: string;
  pitch: string;
  problem: string;
  tags: string[];
  stack: string[];
  links?: { label: string; href: string }[];
  confidential?: boolean;
  highlight: string; // the one number/fact that stops a recruiter
  thumb: string; // WebGL distortion-plane texture (Prompt v3)
};

export const projects: Project[] = [
  {
    index: "01",
    title: "OpenClaw — Autonomous Debugger",
    pitch:
      "An autonomous AI coding engine that detects, fixes, and validates code using a multi-agent LLM pipeline.",
    problem:
      "Debugging is the slowest loop in software. OpenClaw closes it: agents localize the fault, propose a fix, run the tests, and only report back when the fix is proven.",
    tags: ["agents", "llm", "dev-tools", "open-source"],
    stack: ["Python", "Multi-agent LLM pipeline"],
    links: [
      {
        label: "GitHub",
        href: "https://github.com/VisheshJain21/Autonomous-Debugger-AI-Agent",
      },
    ],
    highlight: "Detect → fix → validate, end-to-end without a human",
    // TODO(vishesh): replace with a real OpenClaw screenshot/GIF
    thumb: "/images/work/placeholder-project-1.svg",
  },
  {
    index: "02",
    title: "Self-Healing Delivery Platform",
    pitch:
      "A production notification platform that delivers to thousands of field agents across four independent channels with automatic failover.",
    problem:
      "One delivery channel always fails eventually. This platform routes every message through a 4-channel failover chain under a unified delivery-status state machine — while an autonomous agent team monitors the system, learns from failures, and heals stuck jobs on its own.",
    tags: ["agents", "fastapi", "automation", "production"],
    stack: ["Python", "FastAPI", "Selenium", "SQLite", "Node.js"],
    confidential: true,
    highlight: "948 tests green · self-healing agent team · in production",
    // TODO(vishesh): replace with a sanitized dashboard screenshot
    thumb: "/images/work/placeholder-project-2.svg",
  },
  {
    index: "03",
    title: "NEXUS — Workforce Intelligence",
    pitch:
      "An enterprise workforce-intelligence platform with AI insights, real-time updates, and full auth — deployed live.",
    problem:
      "Workforce data is usually a spreadsheet graveyard. NEXUS turns it into a living dashboard: AI-generated insights over real-time WebSocket streams, JWT-secured, shipped in containers.",
    tags: ["full-stack", "websocket", "ai-insights", "live-demo"],
    stack: ["JavaScript", "PHP 8.2", "WebSocket", "JWT", "Docker Compose"],
    links: [
      {
        label: "GitHub",
        href: "https://github.com/VisheshJain21/enterprise-workforce-intelligence-platform",
      },
      { label: "Live demo", href: "https://project-q6s55.vercel.app" },
    ],
    highlight: "Full stack, real-time, deployed",
    // TODO(vishesh): replace with a real NEXUS screenshot/GIF
    thumb: "/images/work/placeholder-project-3.svg",
  },
  {
    index: "04",
    title: "Safety-Critical Ops Automation",
    pitch:
      "AI-vision automation for a live enterprise portal where a single wrong retry permanently locks an account.",
    problem:
      "The constraint was brutal: one attempt, zero retries, on a live system. So the design is fail-closed — AI vision reads the challenge screen, a human supplies only the OTP, every step is screenshot-audited to an append-only log, and the linked support ticket resolves itself on success.",
    tags: ["ai-vision", "playwright", "safety-critical", "audit"],
    stack: ["Python", "Playwright", "LLM vision", "Zoho API"],
    confidential: true,
    highlight: "One attempt, zero retries — engineered fail-closed",
    // TODO(vishesh): replace with a sanitized ops-dashboard screenshot
    thumb: "/images/work/placeholder-project-4.svg",
  },
];

export const workMeta = {
  eyebrow: "Selected Systems",
  heading: "Work",
  count: `${String(projects.length).padStart(2, "0")} / built & shipped`,
  moreHref: "https://github.com/VisheshJain21?tab=repositories",
  moreLabel: "More on GitHub",
  confidentialNote: "Internal production system — details available in conversation.",
};
