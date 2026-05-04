import { describe, expect, it } from "vitest";
import {
  ResumeProfileSchema,
  JobAnalysisSchema,
  CoverLetterSchema,
  ATSResumeSchema,
} from "@/lib/ai/schemas";

describe("ResumeProfileSchema", () => {
  it("accepts a minimal profile", () => {
    const r = ResumeProfileSchema.safeParse({
      name: "X",
      summary: "...",
      skills: [{ name: "React", level: 80 }],
      experience: [{ role: "Dev", company: "C", dates: "2020" }],
    });
    expect(r.success).toBe(true);
  });

  it("clamps skill level to 0-100", () => {
    const r = ResumeProfileSchema.safeParse({
      name: "X",
      summary: "...",
      skills: [{ name: "React", level: 150 }],
      experience: [],
    });
    expect(r.success).toBe(false);
  });
});

describe("JobAnalysisSchema", () => {
  it("requires fitScore + reasoning + skills + gaps + signals", () => {
    const r = JobAnalysisSchema.safeParse({
      fitScore: 85,
      matchReasoning: "ok",
      skills: [{ skill: "x", cand: 80, req: 70 }],
      gaps: [{ label: "y", weeksToClose: 2 }],
      signals: [{ label: "s", value: 80 }],
    });
    expect(r.success).toBe(true);
  });

  it("rejects out-of-range fitScore", () => {
    const r = JobAnalysisSchema.safeParse({
      fitScore: 105,
      matchReasoning: "ok",
      skills: [],
      gaps: [],
      signals: [],
    });
    expect(r.success).toBe(false);
  });
});

describe("CoverLetterSchema + ATSResumeSchema", () => {
  it("accept basic shapes", () => {
    expect(
      CoverLetterSchema.safeParse({ greeting: "Hi", body: "...", closing: "—" }).success,
    ).toBe(true);
    expect(
      ATSResumeSchema.safeParse({
        summary: "...",
        coreCompetencies: ["x"],
        experience: [{ title: "A", company: "B", dates: "2020", bullets: ["did X"] }],
      }).success,
    ).toBe(true);
  });
});
