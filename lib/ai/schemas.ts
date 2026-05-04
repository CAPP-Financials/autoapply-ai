/**
 * Zod schemas for AI structured outputs. These double as the on-the-wire
 * contract with each provider (via `generateObject` / `streamObject`)
 * and as runtime validation when caching to DB.
 */
import { z } from "zod";

export const ResumeProfileSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  location: z.string().optional(),
  summary: z.string(),
  skills: z
    .array(
      z.object({
        name: z.string(),
        level: z.number().int().min(0).max(100),
      }),
    )
    .max(40),
  experience: z
    .array(
      z.object({
        role: z.string(),
        company: z.string(),
        dates: z.string(),
        bullets: z.array(z.string()).max(10).optional(),
      }),
    )
    .max(20),
  education: z
    .array(
      z.object({
        degree: z.string(),
        school: z.string(),
        dates: z.string(),
      }),
    )
    .max(10)
    .optional(),
  certifications: z.array(z.string()).max(20).optional(),
  // Contact lives separately so we never round-trip it through the LLM.
});
export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;

export const JobAnalysisSchema = z.object({
  fitScore: z.number().int().min(0).max(100),
  fitDelta: z.number().int().min(-100).max(100).default(0),
  matchReasoning: z.string(),
  skills: z.array(
    z.object({
      skill: z.string(),
      cand: z.number().int().min(0).max(100),
      req: z.number().int().min(0).max(100),
    }),
  ),
  gaps: z.array(
    z.object({
      label: z.string(),
      weeksToClose: z.number().int().min(0).max(104),
    }),
  ),
  signals: z.array(
    z.object({
      label: z.string(),
      value: z.number().int().min(0).max(100),
    }),
  ),
});
export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;

export const CoverLetterSchema = z.object({
  greeting: z.string(),
  body: z.string(),
  closing: z.string(),
});
export type CoverLetter = z.infer<typeof CoverLetterSchema>;

export const ATSResumeSchema = z.object({
  summary: z.string(),
  coreCompetencies: z.array(z.string()).max(15),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      dates: z.string(),
      bullets: z.array(z.string()).max(8),
    }),
  ),
});
export type ATSResume = z.infer<typeof ATSResumeSchema>;

export const InterviewEvalSchema = z.object({
  evaluation: z.string(),
  signals: z.array(
    z.object({
      label: z.string(),
      score: z.number().int().min(0).max(100),
    }),
  ),
  recommended_next_step: z.string(),
});
export type InterviewEval = z.infer<typeof InterviewEvalSchema>;
