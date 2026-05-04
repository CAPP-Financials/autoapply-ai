/**
 * LLM Council — fan out an analysis across all of the user's configured
 * providers in parallel, then synthesize a single answer that takes the
 * median fit score and merges reasoning + gaps with provenance.
 *
 * Stays cheap by skipping the synthesis step when there's only one
 * configured provider; falls back to a plain single-provider call.
 */
import { generateObject } from "ai";
import { JobAnalysisSchema, type JobAnalysis } from "./schemas";
import { listConfiguredProviders, getModel, type ProviderId } from "./provider";

export type CouncilTrace = {
  provider: ProviderId;
  model: string;
  fit: number | null;
  latencyMs: number;
  error?: string;
};

export type CouncilResult = {
  analysis: JobAnalysis;
  trace: { calls: CouncilTrace[] };
};

export async function runCouncil(args: {
  userId: string;
  prompt: string;
  /** Cap providers actually queried (free-tier safety). Default: all configured. */
  maxProviders?: number;
}): Promise<CouncilResult> {
  const configured = await listConfiguredProviders(args.userId);
  if (configured.length === 0) {
    throw new Error(
      "No providers configured. Add at least one API key in Settings → Providers.",
    );
  }
  const picks = configured.slice(0, args.maxProviders ?? configured.length);

  const calls: { provider: ProviderId; promise: Promise<JobAnalysis>; started: number }[] = [];
  for (const { provider } of picks) {
    const started = Date.now();
    const promise = (async () => {
      const { model } = await getModel(args.userId, provider);
      const r = await generateObject({
        model,
        schema: JobAnalysisSchema,
        prompt: args.prompt,
      });
      return r.object as JobAnalysis;
    })();
    calls.push({ provider, promise, started });
  }

  const results = await Promise.allSettled(calls.map((c) => c.promise));
  const traces: CouncilTrace[] = [];
  const successes: { provider: ProviderId; out: JobAnalysis }[] = [];
  for (let i = 0; i < calls.length; i++) {
    const c = calls[i];
    const r = results[i];
    const cfg = picks[i];
    if (r.status === "fulfilled") {
      successes.push({ provider: c.provider, out: r.value });
      traces.push({
        provider: c.provider,
        model: "(default)",
        fit: r.value.fitScore,
        latencyMs: Date.now() - c.started,
      });
    } else {
      traces.push({
        provider: c.provider,
        model: "(default)",
        fit: null,
        latencyMs: Date.now() - c.started,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
    }
    void cfg;
  }

  if (successes.length === 0) {
    throw new Error(
      "All council providers failed. Trace: " + JSON.stringify(traces.map((t) => t.error)),
    );
  }

  // Synthesize: median fit, longest reasoning, merged gaps + skills.
  const fits = successes.map((s) => s.out.fitScore).sort((a, b) => a - b);
  const median = fits[Math.floor(fits.length / 2)];
  const longestReasoning = successes
    .map((s) => s.out.matchReasoning)
    .reduce((a, b) => (a.length >= b.length ? a : b), "");

  // Dedupe gaps by label, keeping the smallest weeksToClose.
  const gapMap = new Map<string, number>();
  for (const s of successes) {
    for (const g of s.out.gaps ?? []) {
      const cur = gapMap.get(g.label);
      gapMap.set(g.label, cur == null ? g.weeksToClose : Math.min(cur, g.weeksToClose));
    }
  }
  const gaps = Array.from(gapMap, ([label, weeksToClose]) => ({ label, weeksToClose }));

  // Average skills cand/req for skills present in at least one analysis.
  const skillMap = new Map<string, { cand: number[]; req: number[] }>();
  for (const s of successes) {
    for (const sk of s.out.skills ?? []) {
      const e = skillMap.get(sk.skill) ?? { cand: [], req: [] };
      e.cand.push(sk.cand);
      e.req.push(sk.req);
      skillMap.set(sk.skill, e);
    }
  }
  const skills = Array.from(skillMap, ([skill, e]) => ({
    skill,
    cand: Math.round(avg(e.cand)),
    req: Math.round(avg(e.req)),
  }));

  // Average signals.
  const sigMap = new Map<string, number[]>();
  for (const s of successes) {
    for (const sig of s.out.signals ?? []) {
      const arr = sigMap.get(sig.label) ?? [];
      arr.push(sig.value);
      sigMap.set(sig.label, arr);
    }
  }
  const signals = Array.from(sigMap, ([label, values]) => ({ label, value: Math.round(avg(values)) }));

  return {
    analysis: {
      fitScore: median,
      fitDelta: 0,
      matchReasoning: longestReasoning,
      skills,
      gaps,
      signals,
    },
    trace: { calls: traces },
  };
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
