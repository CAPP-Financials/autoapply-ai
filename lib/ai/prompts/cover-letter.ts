import type { ResumeProfile, JobAnalysis } from "../schemas";

export function buildCoverLetterPrompt(args: {
  profile: ResumeProfile;
  jdText: string;
  company: string;
  role: string;
  analysis: JobAnalysis;
}): string {
  return `Draft a cover letter for ${args.profile.name ?? "the candidate"} applying to ${args.role} at ${args.company}.

Profile (JSON):
${JSON.stringify(args.profile, null, 2)}

Job description:
"""
${args.jdText}
"""

Top match reasoning: ${args.analysis.matchReasoning}

Constraints:
- Tone: confident, specific, technical. No "I am writing to apply" boilerplate.
- 2-3 short paragraphs, ~180-240 words.
- Cite ONE concrete project/result that maps to a stated job requirement.
- Acknowledge ONE gap (from analysis.gaps) honestly with a one-line plan.
- No closing salutations like "Sincerely" — just "— ${args.profile.name?.split(" ")[0] ?? "the candidate"}" on a final line.
- No emoji, no markdown headings.

Output JSON matching the schema: { greeting, body, closing }.`;
}
