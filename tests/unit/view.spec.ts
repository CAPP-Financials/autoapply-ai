import { describe, it, expect } from "vitest";
import { toJobView, computeKpis, type AnalysisRow } from "@/lib/data/view";
import { JobAnalysisSchema } from "@/lib/ai/schemas";

/**
 * toJobView is the seam between the DB and every dashboard component. It was
 * shipped with `a.gaps as string[]`, a cast that typechecked and crashed for
 * real users ("Objects are not valid as a React child") while /demo rendered
 * perfectly on correctly-shaped fixtures. These tests exist so the cast can
 * never lie again.
 */

// A row shaped the way the analyze pipeline actually writes it.
function row(over: Partial<AnalysisRow> = {}): AnalysisRow {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analysis: {
      jobId: "job-1",
      fitScore: 82,
      fitDelta: 3,
      matchReasoning: "Strong overlap.",
      skills: [{ skill: "React", cand: 90, req: 80 }],
      gaps: [{ label: "Go", weeksToClose: 4 }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    company: "Acme",
    role: "Engineer",
    ...over,
  };
}

describe("toJobView", () => {
  it("keeps gaps as {label, weeksToClose} — never bare strings", () => {
    // The exact regression: JobDetail renders g.label and g.weeksToClose.
    const v = toJobView(row());
    expect(v.gaps).toEqual([{ label: "Go", weeksToClose: 4 }]);
    expect(typeof v.gaps[0]).toBe("object");
  });

  it("agrees with the schema the analyze route writes", () => {
    // Guards the cast at its source: if JobAnalysisSchema's gaps/skills shape
    // ever changes, this fails instead of the UI crashing in production.
    const parsed = JobAnalysisSchema.parse({
      fitScore: 70,
      fitDelta: 0,
      matchReasoning: "ok",
      skills: [{ skill: "TS", cand: 80, req: 70 }],
      gaps: [{ label: "Ruby", weeksToClose: 6 }],
      signals: [{ label: "Remote", value: 90 }],
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = toJobView(row({ analysis: { jobId: "j", ...parsed } as any }));
    expect(v.gaps[0].label).toBe("Ruby");
    expect(v.gaps[0].weeksToClose).toBe(6);
    expect(v.skills[0].skill).toBe("TS");
  });

  it("survives a JD with no salary (the common real case)", () => {
    const v = toJobView(row({ salaryLowUsd: null, salaryHighUsd: null }));
    expect(v.salaryUSD).toBe(0);
    expect(v.salaryRange).toBe("—");
  });

  it("uses the midpoint of a salary band", () => {
    const v = toJobView(row({ salaryLowUsd: 100_000, salaryHighUsd: 200_000 }));
    expect(v.salaryUSD).toBe(150_000);
    expect(v.salaryRange).toBe("$100k – $200k");
  });

  it("handles a one-sided salary band", () => {
    const v = toJobView(row({ salaryLowUsd: 120_000, salaryHighUsd: null }));
    expect(v.salaryUSD).toBe(120_000);
    expect(v.salaryRange).toBe("$120k");
  });

  it("tolerates null jsonb and null columns without throwing", () => {
    const v = toJobView(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      row({ analysis: { jobId: "j", fitScore: 0, fitDelta: 0, matchReasoning: null, skills: null, gaps: null } as any, tags: null, location: null }),
    );
    expect(v.skills).toEqual([]);
    expect(v.gaps).toEqual([]);
    expect(v.tags).toEqual([]);
    expect(v.matchReasoning).toBe("");
    expect(v.location).toBe("—");
  });
});

describe("computeKpis", () => {
  it("returns zeros for an empty dashboard instead of NaN", () => {
    // The state every new user starts in.
    expect(computeKpis([])).toEqual({ total: 0, avgFit: 0, highFit: 0, medianComp: 0 });
  });

  it("averages fit and counts high fits at the 85 boundary", () => {
    const jobs = [toJobView(row()), toJobView(row({ analysis: { jobId: "b", fitScore: 88, fitDelta: 0, matchReasoning: "", skills: [], gaps: [] } as never })) ];
    const k = computeKpis(jobs);
    expect(k.total).toBe(2);
    expect(k.avgFit).toBe(85); // (82 + 88) / 2
    expect(k.highFit).toBe(1); // only 88 clears >= 85
  });

  it("ignores unsalaried jobs when taking the median", () => {
    const jobs = [
      toJobView(row({ salaryLowUsd: 100_000, salaryHighUsd: 100_000 })),
      toJobView(row({ salaryLowUsd: null, salaryHighUsd: null })),
    ];
    expect(computeKpis(jobs).medianComp).toBe(100_000);
  });
});
