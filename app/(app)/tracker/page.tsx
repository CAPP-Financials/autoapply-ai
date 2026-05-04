/**
 * Tracker (kanban) — Phase 13.
 * Stub: lists applications by status. Drag-to-update lands later.
 */
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/primitives/Card";
import { Label } from "@/components/primitives/Label";
import { MOCK_JOBS } from "@/lib/data/mock";

const COLUMNS = [
  { id: "ready", label: "Ready" },
  { id: "applied", label: "Applied" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
] as const;

export default function TrackerPage() {
  // Naive bucket assignment for the demo.
  const applied = MOCK_JOBS.filter((j) => j.appliedAt);
  const ready = MOCK_JOBS.filter((j) => !j.appliedAt);

  const buckets: Record<(typeof COLUMNS)[number]["id"], typeof MOCK_JOBS> = {
    ready,
    applied,
    interviewing: [],
    offer: [],
    rejected: [],
  };

  return (
    <Shell
      active="tracker"
      crumbs={["autoapply", "tracker", "applications"]}
      user={{ name: "JOHN SMITH", resumeMeta: "resume.v3 · 2 KB" }}
      configuredProviders={["claude-3.5", "gemini-2.0", "gpt-4o", "llm council"]}
      defaultProvider="claude-3.5"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {COLUMNS.map((col) => (
          <Card key={col.id} className="flex flex-col">
            <header className="border-line text-fg-2 flex items-center justify-between border-b px-3.5 py-2.5 text-[11px] tracking-[0.16em] uppercase">
              <span>{col.label}</span>
              <span className="text-fg-3">{buckets[col.id].length}</span>
            </header>
            <div className="flex flex-col gap-2 p-3">
              {buckets[col.id].length === 0 && (
                <div className="text-fg-3 px-1 text-[11px]">empty</div>
              )}
              {buckets[col.id].map((j) => (
                <div key={j.id} className="bg-bg-2 border-line-soft border p-2.5 text-[12px]">
                  <Label>{j.company}</Label>
                  <div className="mt-1 font-semibold">{j.jobTitle}</div>
                  <div className="text-fg-3 mt-1 text-[10px]">fit {j.fitScore}%</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
