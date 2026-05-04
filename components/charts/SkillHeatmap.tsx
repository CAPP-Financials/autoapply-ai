import { Fragment } from "react";
import type { MockJob } from "@/lib/data/mock";

const SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "Postgres",
  "LLMs",
  "Go",
  "Ruby",
  "Next.js",
  "Edge",
];

const CANDIDATE: Record<string, number> = {
  React: 92,
  TypeScript: 88,
  "Node.js": 85,
  Python: 82,
  Postgres: 78,
  LLMs: 88,
  Go: 35,
  Ruby: 25,
  "Next.js": 70,
  Edge: 40,
};

function bgFor(diff: number): string {
  if (diff >= 10) return "var(--color-sig-good)";
  if (diff >= -5) return "var(--color-sig-ok)";
  if (diff >= -25) return "var(--color-sig-mid)";
  return "var(--color-sig-bad)";
}

/**
 * Candidate-vs-required heatmap. Diff colored by the same signal palette
 * as the fit score; +10 → exceeds, -25 → major gap.
 */
export function SkillHeatmap({ jobs }: { jobs: MockJob[] }) {
  const requiredFor = (job: MockJob) => {
    const map: Record<string, number> = {};
    for (const s of job.skills) map[s.skill] = s.req;
    return SKILLS.map((sk) => (sk in map ? map[sk] : null));
  };

  return (
    <div className="p-4">
      <div
        className="grid gap-0.5 text-[10px]"
        style={{ gridTemplateColumns: `70px repeat(${SKILLS.length}, 1fr)` }}
      >
        <div />
        {SKILLS.map((sk) => (
          <div
            key={sk}
            className="text-fg-3 py-1 tracking-[0.06em]"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {sk}
          </div>
        ))}
        {jobs.map((j) => {
          const reqs = requiredFor(j);
          return (
            <Fragment key={j.id}>
              <div className="text-fg-1 truncate pr-1.5 text-right text-[11px]">{j.company}</div>
              {reqs.map((req, i) => {
                if (req == null) {
                  return <div key={i} className="bg-bg-2 h-[26px]" />;
                }
                const cand = CANDIDATE[SKILLS[i]];
                const diff = cand - req;
                return (
                  <div
                    key={i}
                    title={`${j.company} · ${SKILLS[i]}: have ${cand}, need ${req}`}
                    className="text-bg-0 grid h-[26px] place-items-center text-[9px] font-bold opacity-90"
                    style={{ background: bgFor(diff) }}
                  >
                    {diff >= 0 ? "+" : ""}
                    {diff}
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </div>
      <div className="text-fg-3 mt-3.5 flex gap-3.5 text-[10px]">
        <Legend label="exceeds" color="var(--color-sig-good)" />
        <Legend label="meets" color="var(--color-sig-ok)" />
        <Legend label="gap" color="var(--color-sig-mid)" />
        <Legend label="major gap" color="var(--color-sig-bad)" />
      </div>
    </div>
  );
}

function Legend({ label, color }: { label: string; color: string }) {
  return (
    <span>
      <i
        className="-mb-px mr-1.5 inline-block h-2.5 w-2.5"
        style={{ background: color, verticalAlign: -1 }}
      />
      {label}
    </span>
  );
}
