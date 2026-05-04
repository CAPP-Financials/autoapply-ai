import type { JobAnalysis } from "../schemas";

export function buildInterviewEvalPrompt(args: {
  notes: string;
  company: string;
  role: string;
  analysis: JobAnalysis;
}): string {
  return `Evaluate post-interview notes against market expectations for ${args.role} at ${args.company}.

Notes (verbatim):
"""
${args.notes}
"""

Prior fit analysis: fitScore=${args.analysis.fitScore}, gaps=${args.analysis.gaps.map((g) => g.label).join(", ")}.

Output JSON:
- evaluation (60-100 words): assessment, signal/anti-signal, level fit
- signals (4 entries): {label, score 0-100}
- recommended_next_step: one sentence imperative

Be candid. If the notes suggest weakness on a critical signal, name it.`;
}
