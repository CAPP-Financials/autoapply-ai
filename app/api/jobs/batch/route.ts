import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { generateObject } from "ai";
import { getSession } from "@/lib/auth/guard";
import { parseJson, ipFrom, uaFrom } from "@/lib/validate";
import { db } from "@/lib/db/client";
import { batches, batchJobs, jobs } from "@/lib/db/schema";
import { insertJob } from "@/lib/db/queries/job";
import { insertAnalysis } from "@/lib/db/queries/analysis";
import { latestResume } from "@/lib/db/queries/resume";
import { getModel, type ProviderId } from "@/lib/ai/provider";
import { JobAnalysisSchema, type ResumeProfile } from "@/lib/ai/schemas";
import { buildAnalyzeJobPrompt } from "@/lib/ai/prompts/analyze-job";
import { redact } from "@/lib/ai/redact";
import { audit } from "@/lib/audit";
import { checkRate } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 290; // just under the 300s Fluid Compute cap

const PostSchema = z
  .object({
    provider: z.enum([
      "anthropic",
      "openai",
      "google",
      "groq",
      "openrouter",
      "ollama",
      "council",
    ]),
    items: z
      .array(
        z.object({
          company: z.string().min(1).max(120),
          role: z.string().min(1).max(160),
          location: z.string().max(120).optional(),
          jdText: z.string().min(40).max(20_000),
          salaryLowUsd: z.number().int().min(0).max(10_000_000).optional(),
          salaryHighUsd: z.number().int().min(0).max(10_000_000).optional(),
        }),
      )
      .min(1)
      .max(20),
  })
  .strict();

/**
 * Start a batch. Writes a `batches` row + N `batch_jobs` (status=queued)
 * + N `jobs`, then synchronously processes within the function's
 * 290s budget. The client polls `/api/batches/[id]` and re-invokes this
 * endpoint with `?resume=<batchId>` if it stalls.
 *
 * Resumability: handler always picks up `batch_jobs.status=queued` rows
 * by `created_at asc` and processes sequentially. Crash mid-batch → next
 * call resumes at the first queued row.
 */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const resumeId = url.searchParams.get("resume");
  if (resumeId) return runBatch(s.userId, resumeId, ipFrom(req), uaFrom(req));

  const rl = await checkRate({ bucket: "analyze", key: `batch:${s.userId}` });
  if (!rl.ok) return NextResponse.json({ error: "Rate limited", reset: rl.reset }, { status: 429 });

  const parsed = await parseJson(req, PostSchema);
  if (!parsed.ok) return parsed.res;

  // Insert jobs + batch in a single transaction.
  const created = await db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(batches)
      .values({ userId: s.userId, total: parsed.data.items.length, status: "queued" })
      .returning();

    const jobIds: string[] = [];
    for (const it of parsed.data.items) {
      const [j] = await tx
        .insert(jobs)
        .values({
          userId: s.userId,
          company: it.company,
          role: it.role,
          location: it.location,
          jdText: it.jdText,
          salaryLowUsd: it.salaryLowUsd,
          salaryHighUsd: it.salaryHighUsd,
        })
        .returning({ id: jobs.id });
      jobIds.push(j.id);
    }
    await tx.insert(batchJobs).values(
      jobIds.map((jid) => ({ batchId: batch.id, jobId: jid, status: "queued" as const })),
    );
    return { batchId: batch.id, jobIds };
  });

  audit({
    userId: s.userId,
    action: "batch_started",
    targetType: "batch",
    targetId: created.batchId,
    ip: ipFrom(req),
    ua: uaFrom(req),
  });

  // Kick off processing (we already have the request open; do it inline).
  return runBatch(s.userId, created.batchId, ipFrom(req), uaFrom(req));
}

async function runBatch(
  userId: string,
  batchId: string,
  ip?: string,
  ua?: string,
): Promise<Response> {
  const [batch] = await db
    .select()
    .from(batches)
    .where(and(eq(batches.id, batchId), eq(batches.userId, userId)))
    .limit(1);
  if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

  await db
    .update(batches)
    .set({ status: "running" })
    .where(eq(batches.id, batchId));

  const resume = await latestResume(userId as never);
  if (!resume?.parsedJson) {
    await db
      .update(batches)
      .set({ status: "failed", finishedAt: new Date() })
      .where(eq(batches.id, batchId));
    return NextResponse.json({ error: "Upload a resume first" }, { status: 412 });
  }
  const profile = resume.parsedJson as ResumeProfile;

  const provider: ProviderId = "google"; // TODO: persist provider per-batch; for now default to free Gemini if available
  const { model } = await getModel(userId, provider);

  // Process queued rows sequentially.
  let processed = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const queued = await db
      .select({
        bjId: batchJobs.id,
        jobId: batchJobs.jobId,
        company: jobs.company,
        role: jobs.role,
        jdText: jobs.jdText,
      })
      .from(batchJobs)
      .innerJoin(jobs, eq(jobs.id, batchJobs.jobId))
      .where(and(eq(batchJobs.batchId, batchId), eq(batchJobs.status, "queued")))
      .orderBy(asc(batchJobs.id))
      .limit(1);
    if (!queued[0]) break;
    const q = queued[0];

    await db
      .update(batchJobs)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(batchJobs.id, q.bjId));

    try {
      const { text: redactedJd } = redact(q.jdText);
      const r = await generateObject({
        model,
        schema: JobAnalysisSchema,
        prompt: buildAnalyzeJobPrompt({
          profile,
          jdText: redactedJd,
          company: q.company,
          role: q.role,
        }),
      });
      await insertAnalysis({
        jobId: q.jobId,
        resumeId: resume.id,
        provider,
        model: "gemini-1.5-flash-latest",
        fitScore: r.object.fitScore,
        fitDelta: r.object.fitDelta ?? 0,
        matchReasoning: r.object.matchReasoning,
        gaps: r.object.gaps,
        skills: r.object.skills,
        signals: r.object.signals,
        trace: { provider },
      });
      await db
        .update(batchJobs)
        .set({ status: "done", finishedAt: new Date() })
        .where(eq(batchJobs.id, q.bjId));
      await db
        .update(batches)
        .set({ completed: batch.completed + ++processed })
        .where(eq(batches.id, batchId));
    } catch (err) {
      logger.warn({ err, jobId: q.jobId }, "batch job failed");
      await db
        .update(batchJobs)
        .set({
          status: "failed",
          finishedAt: new Date(),
          error: err instanceof Error ? err.message : String(err),
        })
        .where(eq(batchJobs.id, q.bjId));
      await db
        .update(batches)
        .set({ failed: batch.failed + 1 })
        .where(eq(batches.id, batchId));
    }
  }

  // Mark batch done if no more queued rows.
  const stillQueued = await db
    .select({ id: batchJobs.id })
    .from(batchJobs)
    .where(and(eq(batchJobs.batchId, batchId), eq(batchJobs.status, "queued")))
    .limit(1);
  if (!stillQueued[0]) {
    await db
      .update(batches)
      .set({ status: "done", finishedAt: new Date() })
      .where(eq(batches.id, batchId));
    audit({
      userId,
      action: "batch_finished",
      targetType: "batch",
      targetId: batchId,
      ip,
      ua,
    });
  }

  return NextResponse.json({ batchId, processed });
}
