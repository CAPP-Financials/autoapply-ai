import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";
import { listAnalysesForUser } from "@/lib/db/queries/analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await listAnalysesForUser(s.userId);

  // Aggregate KPIs.
  const total = rows.length;
  const avgFit = total ? Math.round(rows.reduce((a, r) => a + r.analysis.fitScore, 0) / total) : 0;
  const highFit = rows.filter((r) => r.analysis.fitScore >= 85).length;

  return NextResponse.json({
    kpis: { total, avgFit, highFit },
    rows: rows.map((r) => ({
      id: r.analysis.id,
      jobId: r.analysis.jobId,
      company: r.company,
      role: r.role,
      fitScore: r.analysis.fitScore,
      fitDelta: r.analysis.fitDelta,
      provider: r.analysis.provider,
      createdAt: r.analysis.createdAt,
    })),
  });
}
