/**
 * Tracker (kanban) — live.
 *
 * Buckets by the real `applications.status` enum instead of the old fixture
 * heuristic (which inferred "applied" from a non-null appliedAt and left the
 * other three columns permanently empty).
 */
import { requireSession } from "@/lib/auth/guard";
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/primitives/Card";
import { Label } from "@/components/primitives/Label";
import { listApplicationsForUser } from "@/lib/db/queries/application";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { id: "ready", label: "Ready" },
  { id: "applied", label: "Applied" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

type Entry = { id: string; company: string; role: string; fitScore: number };

export default async function TrackerPage() {
  const s = await requireSession();
  const rows = await listApplicationsForUser(s.userId);

  const buckets: Record<ColumnId, Entry[]> = {
    ready: [],
    applied: [],
    interviewing: [],
    offer: [],
    rejected: [],
  };

  for (const r of rows) {
    const col = r.app.status as ColumnId;
    if (!(col in buckets)) continue; // tolerate an enum value the UI predates
    buckets[col].push({
      id: r.app.id,
      company: r.company,
      role: r.role,
      fitScore: r.analysis.fitScore,
    });
  }

  return (
    <Shell
      active="tracker"
      crumbs={["autoapply", "tracker", `${rows.length} application${rows.length === 1 ? "" : "s"}`]}
      user={{ name: s.name.toUpperCase() }}
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
                  <div className="mt-1 font-semibold">{j.role}</div>
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
