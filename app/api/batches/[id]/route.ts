import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { batches, batchJobs } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const [b] = await db
    .select()
    .from(batches)
    .where(and(eq(batches.id, id), eq(batches.userId, s.userId)))
    .limit(1);
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await db
    .select({
      id: batchJobs.id,
      jobId: batchJobs.jobId,
      status: batchJobs.status,
      startedAt: batchJobs.startedAt,
      finishedAt: batchJobs.finishedAt,
      updatedAt: batchJobs.updatedAt,
      error: batchJobs.error,
    })
    .from(batchJobs)
    .where(eq(batchJobs.batchId, id));

  return NextResponse.json({ batch: b, items });
}
