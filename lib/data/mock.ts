/**
 * Fixture data for `/demo` and Storybook-style verification.
 * Source: design bundle's `aa-shared.jsx` MOCK_JOBS — verbatim shape.
 *
 * Do not import this from production server paths. Demo + tests only.
 */

export type MockSkill = { skill: string; cand: number; req: number };

export type MockJob = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  salaryRange: string;
  salaryUSD: number;
  salaryINR: number;
  fitScore: number;
  fitDelta: number;
  tags: string[];
  matchReasoning: string;
  skills: MockSkill[];
  gaps: string[];
  appliedAt: string | null;
  coverLetter?: string;
};

export const MOCK_JOBS: MockJob[] = [
  {
    id: "j1",
    jobTitle: "Staff Frontend Engineer",
    company: "Linear",
    location: "Remote · US",
    salaryRange: "$210k – $260k",
    salaryUSD: 235_000,
    salaryINR: 1_950_000,
    fitScore: 92,
    fitDelta: 6,
    tags: ["React", "TypeScript", "Design Systems"],
    matchReasoning:
      "Strong overlap on React/TS leadership; resume's microservices work and AI feature shipping align closely with the role's scope.",
    skills: [
      { skill: "React", cand: 92, req: 85 },
      { skill: "TypeScript", cand: 88, req: 90 },
      { skill: "Design Sys", cand: 70, req: 80 },
      { skill: "Perf", cand: 80, req: 75 },
      { skill: "Testing", cand: 65, req: 80 },
      { skill: "Leadership", cand: 78, req: 85 },
    ],
    gaps: ["Visual regression testing", "Storybook ownership"],
    appliedAt: null,
    coverLetter: `Hi Linear team,

I lead frontend at TechCorp where my React platform serves 10k+ daily users. The chance to ship Linear's design system at scale — where pixel-craft and motion meet engineering rigor — is exactly the work I want to do next. I've spent the last two years pushing TypeScript inference, perf budgets, and AI integration into the team's everyday loop.

Happy to walk through the dashboard rebuild and how I'd tackle Linear's next-gen graph view.

— John`,
  },
  {
    id: "j2",
    jobTitle: "Senior Full-Stack (AI)",
    company: "Notion",
    location: "San Francisco",
    salaryRange: "$190k – $240k",
    salaryUSD: 215_000,
    salaryINR: 1_790_000,
    fitScore: 87,
    fitDelta: 2,
    tags: ["Node.js", "Python", "LLMs"],
    matchReasoning:
      "Direct match on AI feature work; backend fit on Node/Python is strong. Notion-specific block model would be the ramp.",
    skills: [
      { skill: "React", cand: 92, req: 75 },
      { skill: "Node.js", cand: 85, req: 85 },
      { skill: "Python", cand: 82, req: 80 },
      { skill: "LLMs", cand: 88, req: 85 },
      { skill: "Postgres", cand: 78, req: 80 },
      { skill: "Block model", cand: 30, req: 70 },
    ],
    gaps: ["Block-based document architecture", "Realtime CRDT"],
    appliedAt: null,
  },
  {
    id: "j3",
    jobTitle: "Frontend Engineer",
    company: "Vercel",
    location: "Remote",
    salaryRange: "$170k – $210k",
    salaryUSD: 190_000,
    salaryINR: 1_580_000,
    fitScore: 81,
    fitDelta: -1,
    tags: ["Next.js", "React", "Edge"],
    matchReasoning:
      "Next.js exposure exists but not as primary stack. React fundamentals strong; edge runtime would be new territory.",
    skills: [
      { skill: "Next.js", cand: 70, req: 90 },
      { skill: "React", cand: 92, req: 85 },
      { skill: "TypeScript", cand: 88, req: 85 },
      { skill: "Edge", cand: 40, req: 75 },
      { skill: "Perf", cand: 80, req: 80 },
      { skill: "Testing", cand: 65, req: 70 },
    ],
    gaps: ["Edge runtime patterns", "ISR architectures"],
    appliedAt: "2026-04-22",
  },
  {
    id: "j4",
    jobTitle: "Software Engineer III",
    company: "Stripe",
    location: "New York",
    salaryRange: "$200k – $250k",
    salaryUSD: 225_000,
    salaryINR: 1_870_000,
    fitScore: 76,
    fitDelta: 4,
    tags: ["Ruby", "TypeScript", "Payments"],
    matchReasoning:
      "Backend depth transferable but Ruby is weak; payments domain knowledge is the bigger gap.",
    skills: [
      { skill: "Ruby", cand: 25, req: 80 },
      { skill: "TypeScript", cand: 88, req: 85 },
      { skill: "Distrib.", cand: 72, req: 85 },
      { skill: "Payments", cand: 20, req: 75 },
      { skill: "Postgres", cand: 78, req: 80 },
      { skill: "API design", cand: 82, req: 85 },
    ],
    gaps: ["Ruby fluency", "Payments / financial systems domain"],
    appliedAt: null,
  },
  {
    id: "j5",
    jobTitle: "Senior Backend Engineer",
    company: "Supabase",
    location: "Remote",
    salaryRange: "$160k – $195k",
    salaryUSD: 178_000,
    salaryINR: 1_480_000,
    fitScore: 84,
    fitDelta: 0,
    tags: ["Postgres", "Go", "Realtime"],
    matchReasoning:
      "Postgres and microservices align well. Go is the gap; existing Node/Python work shows quick adoption pattern.",
    skills: [
      { skill: "Postgres", cand: 78, req: 90 },
      { skill: "Go", cand: 35, req: 80 },
      { skill: "Realtime", cand: 60, req: 75 },
      { skill: "Auth", cand: 70, req: 75 },
      { skill: "Docker/K8s", cand: 80, req: 80 },
      { skill: "API design", cand: 82, req: 80 },
    ],
    gaps: ["Production Go", "Realtime replication patterns"],
    appliedAt: null,
  },
  {
    id: "j6",
    jobTitle: "Product Engineer",
    company: "Raycast",
    location: "Remote · EU",
    salaryRange: "$140k – $180k",
    salaryUSD: 160_000,
    salaryINR: 1_330_000,
    fitScore: 68,
    fitDelta: -3,
    tags: ["Swift", "TypeScript"],
    matchReasoning:
      "TS extensions match well but core app is Swift — would need ramp-up. Strong product sensibility shines through.",
    skills: [
      { skill: "Swift", cand: 15, req: 85 },
      { skill: "TypeScript", cand: 88, req: 85 },
      { skill: "Native APIs", cand: 30, req: 80 },
      { skill: "Product", cand: 78, req: 80 },
      { skill: "Perf", cand: 80, req: 80 },
      { skill: "Testing", cand: 65, req: 70 },
    ],
    gaps: ["Swift / native macOS", "AppKit fluency"],
    appliedAt: null,
  },
];

export type MockProfile = {
  name: string;
  role: string;
  location: string;
  email: string;
  links: string[];
  summary: string;
  skills: { name: string; level: number }[];
  experience: { role: string; company: string; dates: string }[];
};

export const MOCK_PROFILE: MockProfile = {
  name: "John Smith",
  role: "Software Engineer",
  location: "San Francisco, CA",
  email: "john.smith@email.com",
  links: ["linkedin.com/in/johnsmith"],
  summary:
    "Experienced full-stack engineer · 5y · React, Node, Python, AI/ML. Led platform serving 10k+ daily users.",
  skills: [
    { name: "React", level: 95 },
    { name: "TypeScript", level: 88 },
    { name: "Node.js", level: 85 },
    { name: "Python", level: 82 },
    { name: "AWS", level: 80 },
    { name: "Docker/K8s", level: 78 },
    { name: "Postgres", level: 78 },
    { name: "LLMs", level: 88 },
    { name: "Tailwind", level: 72 },
    { name: "GraphQL", level: 65 },
  ],
  experience: [
    { role: "Senior Software Engineer", company: "TechCorp Inc.", dates: "2021 — present" },
    { role: "Software Engineer", company: "StartupXYZ", dates: "2019 — 2021" },
    { role: "Junior Developer", company: "WebSolutions", dates: "2018 — 2019" },
  ],
};
