import type { ResumeProfile } from "../schemas";

/**
 * Prompt that scores a job description against a parsed resume profile.
 * Output is constrained by JobAnalysisSchema.
 */
export function buildAnalyzeJobPrompt(args: {
  profile: ResumeProfile;
  jdText: string;
  company: string;
  role: string;
  prevAvgFit?: number;
}): string {
  const profileJSON = JSON.stringify(args.profile, null, 2);
  return `You are evaluating fit between a candidate and a job description.

Candidate profile (JSON):
${profileJSON}

Job:
  Company: ${args.company}
  Role: ${args.role}
  JD:
"""
${args.jdText}
"""

Task — output JSON matching the schema:
1. fitScore (0-100): overall match. Weights: ~50% skills, ~25% seniority,
   ~15% domain, ~10% culture/role-shape. Hard requirements that the candidate
   lacks → cap at 70.
2. fitDelta: vs prior batch average (${args.prevAvgFit ?? "n/a"}). 0 if unknown.
3. matchReasoning (40-80 words): one paragraph, no fluff, evidence-cited.
4. skills (6-8 entries): each {skill, cand 0-100, req 0-100}. Pick the most
   important required skills.
5. gaps (1-4 entries): {label, weeksToClose} — practical learning estimate.
6. signals: {label, value 0-100} for at least these four:
   - "Resume keyword density"
   - "Story-relevance match"
   - "Seniority alignment"
   - "Gap recoverability"

Be honest. If fit is poor, say so.`;
}
