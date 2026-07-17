/**
 * The shape the dashboard components render.
 *
 * This is deliberately derived from the DB row, not from the fixtures — the
 * fixtures adapt to it. Doing it the other way round is how the UI ended up
 * rendering `MOCK_JOBS`: the fixture shape became the contract and the real
 * rows never fit it.
 *
 * Safe to import from production server paths (unlike `lib/data/mock.ts`).
 */
import type { Analysis } from "@/lib/db/schema";

export type SkillView = { skill: string; cand: number; req: number };

/**
 * Matches JobAnalysisSchema.gaps — what the analyze pipeline actually writes
 * to `analyses.gaps`. It is NOT string[]: the fixtures used bare strings, and
 * casting the jsonb column to string[] typechecked while guaranteeing a crash
 * ("Objects are not valid as a React child") for every real user, since /demo
 * renders the correctly-shaped mocks and never hit it.
 */
export type GapView = { label: string; weeksToClose: number };

export type JobView = {
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
  skills: SkillView[];
  gaps: GapView[];
  appliedAt: string | null;
  coverLetter?: string;
};

/** Row shape returned by `listAnalysesForUser`, plus the job columns we render. */
export type AnalysisRow = {
  analysis: Analysis;
  company: string;
  role: string;
  location?: string | null;
  salaryLowUsd?: number | null;
  salaryHighUsd?: number | null;
  tags?: string[] | null;
  appliedAt?: Date | null;
};

const INR_PER_USD = 83;

/** Midpoint of a salary band; 0 when the JD didn't state one (common). */
function midpoint(low?: number | null, high?: number | null): number {
  if (low != null && high != null) return Math.round((low + high) / 2);
  return low ?? high ?? 0;
}

function bandLabel(low?: number | null, high?: number | null): string {
  if (low != null && high != null) return `$${(low / 1000).toFixed(0)}k – $${(high / 1000).toFixed(0)}k`;
  const one = low ?? high;
  return one != null ? `$${(one / 1000).toFixed(0)}k` : "—";
}

/**
 * Adapt a DB row to the render shape. Every optional column is handled here so
 * a JD with no salary or no tags renders rather than throwing — the states the
 * fixtures never had.
 */
export function toJobView(row: AnalysisRow): JobView {
  const a = row.analysis;
  const usd = midpoint(row.salaryLowUsd, row.salaryHighUsd);
  return {
    id: a.jobId,
    jobTitle: row.role,
    company: row.company,
    location: row.location ?? "—",
    salaryRange: bandLabel(row.salaryLowUsd, row.salaryHighUsd),
    salaryUSD: usd,
    salaryINR: usd * INR_PER_USD,
    fitScore: a.fitScore,
    fitDelta: a.fitDelta,
    tags: row.tags ?? [],
    matchReasoning: a.matchReasoning ?? "",
    skills: (a.skills as SkillView[] | null) ?? [],
    gaps: (a.gaps as GapView[] | null) ?? [],
    appliedAt: row.appliedAt ? row.appliedAt.toISOString().slice(0, 10) : null,
  };
}

export type Kpis = {
  total: number;
  avgFit: number;
  highFit: number;
  medianComp: number;
};

/** KPI aggregation shared by the live dashboard and the demo. */
export function computeKpis(jobs: JobView[]): Kpis {
  const total = jobs.length;
  if (total === 0) return { total: 0, avgFit: 0, highFit: 0, medianComp: 0 };
  const avgFit = Math.round(jobs.reduce((a, j) => a + j.fitScore, 0) / total);
  const highFit = jobs.filter((j) => j.fitScore >= 85).length;
  const comps = jobs.map((j) => j.salaryUSD).filter((n) => n > 0).sort((a, b) => a - b);
  const medianComp = comps.length ? comps[Math.floor(comps.length / 2)] : 0;
  return { total, avgFit, highFit, medianComp };
}
