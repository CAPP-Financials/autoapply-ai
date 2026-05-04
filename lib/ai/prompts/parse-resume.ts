/**
 * Prompt for parsing a raw resume PDF text dump into a structured profile.
 * Output is constrained by ResumeProfileSchema via `generateObject`.
 */
export function buildParseResumePrompt(rawText: string): string {
  return `You are extracting a structured profile from a resume.

Rules:
- DO NOT invent skills, roles, or dates. If you can't find a field, omit it.
- Skill levels: 0-100 reflecting confidence based on years and prominence in
  the resume (a skill mentioned in the summary + multiple roles → 90; one-line
  bullet only → 60).
- Bullets: keep verbatim if possible.
- Output JSON matching the schema exactly.

Resume text:
"""
${rawText}
"""`;
}
