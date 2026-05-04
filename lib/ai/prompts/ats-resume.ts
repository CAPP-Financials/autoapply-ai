import type { ResumeProfile, JobAnalysis } from "../schemas";

export function buildATSResumePrompt(args: {
  profile: ResumeProfile;
  company: string;
  role: string;
  analysis: JobAnalysis;
}): string {
  const requiredSkills = args.analysis.skills.filter((s) => s.req >= 70).map((s) => s.skill);
  return `Generate an ATS-optimized resume for "${args.role} · ${args.company}".

Source profile (JSON):
${JSON.stringify(args.profile, null, 2)}

Top required skills to emphasize verbatim: ${requiredSkills.join(", ")}.

Constraints:
- Plain text. No tables, columns, decorative characters.
- Summary: 2-3 lines, lead with seniority + stack + scale.
- coreCompetencies: 8-12 items, mix of skill and tooling, all keyword-friendly.
- Experience: each role's bullets must lead with a verb in past tense and
  contain at least one numeric impact metric ("cut TTI 38%", "served 10k DAU").
- Reorder bullets so the strongest matches with the JD's required skills come
  first.
- Output JSON matching the schema. The renderer will format it as plain text.`;
}
