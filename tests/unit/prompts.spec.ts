import { describe, expect, it } from "vitest";
import { buildAnalyzeJobPrompt } from "@/lib/ai/prompts/analyze-job";
import { buildParseResumePrompt } from "@/lib/ai/prompts/parse-resume";
import { buildCoverLetterPrompt } from "@/lib/ai/prompts/cover-letter";

const sampleProfile = {
  name: "Test User",
  summary: "Senior engineer",
  skills: [{ name: "React", level: 90 }],
  experience: [{ role: "Senior", company: "Acme", dates: "2020-now" }],
};

describe("buildAnalyzeJobPrompt", () => {
  it("inlines company, role, and the JD", () => {
    const p = buildAnalyzeJobPrompt({
      profile: sampleProfile as never,
      jdText: "Looking for a React engineer with TS",
      company: "Linear",
      role: "Staff Frontend",
    });
    expect(p).toContain("Linear");
    expect(p).toContain("Staff Frontend");
    expect(p).toContain("React engineer with TS");
    expect(p).toContain("fitScore");
  });

  it("defaults prevAvgFit hint to n/a when missing", () => {
    const p = buildAnalyzeJobPrompt({
      profile: sampleProfile as never,
      jdText: "JD",
      company: "C",
      role: "R",
    });
    expect(p).toMatch(/prior batch average \(n\/a\)/i);
  });
});

describe("buildParseResumePrompt", () => {
  it("forbids hallucination", () => {
    const p = buildParseResumePrompt("Some resume");
    expect(p).toMatch(/DO NOT invent/);
    expect(p).toContain("Some resume");
  });
});

describe("buildCoverLetterPrompt", () => {
  it("includes the gap-acknowledgement instruction", () => {
    const p = buildCoverLetterPrompt({
      profile: sampleProfile as never,
      jdText: "JD",
      company: "Linear",
      role: "Staff",
      analysis: {
        fitScore: 80,
        fitDelta: 0,
        matchReasoning: "good",
        skills: [],
        gaps: [{ label: "X", weeksToClose: 2 }],
        signals: [],
      },
    });
    expect(p).toMatch(/Acknowledge ONE gap/);
    expect(p).toContain("Linear");
  });
});
