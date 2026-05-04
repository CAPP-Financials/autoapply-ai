import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject, streamText } from "ai";
import { getSession } from "@/lib/auth/guard";
import { getJobById } from "@/lib/db/queries/job";
import { latestResume } from "@/lib/db/queries/resume";
import { insertAnalysis } from "@/lib/db/queries/analysis";
import { getModel, type ProviderId } from "@/lib/ai/provider";
import { runCouncil } from "@/lib/ai/council";
import { JobAnalysisSchema, type ResumeProfile } from "@/lib/ai/schemas";
import { buildAnalyzeJobPrompt } from "@/lib/ai/prompts/analyze-job";
import { redact } from "@/lib/ai/redact";
import { audit } from "@/lib/audit";
import { checkRate } from "@/lib/rate-limit";
import { parseJson, ipFrom, uaFrom } from "@/lib/validate";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

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
    stream: z.boolean().default(true),
  })
  .strict();

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRate({ bucket: "analyze", key: `analyze:${s.userId}` });
  if (!rl.ok) return NextResponse.json({ error: "Rate limited", reset: rl.reset }, { status: 429 });

  const { id } = await ctx.params;
  const parsed = await parseJson(req, PostSchema);
  if (!parsed.ok) return parsed.res;
  const { provider } = parsed.data;

  const [job, resume] = await Promise.all([getJobById(s.userId, id), latestResume(s.userId)]);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (!resume?.parsedJson)
    return NextResponse.json({ error: "Upload a resume first" }, { status: 412 });

  // Redact PII from the JD before any provider sees it.
  const { text: redactedJd } = redact(job.jdText);
  const profile = resume.parsedJson as ResumeProfile;

  const prompt = buildAnalyzeJobPrompt({
    profile,
    jdText: redactedJd,
    company: job.company,
    role: job.role,
  });

  const t0 = Date.now();

  if (provider === "council") {
    // Council is non-streaming (parallel fan-out + synth). Returns final.
    const r = await runCouncil({ userId: s.userId, prompt });
    const inserted = await insertAnalysis({
      jobId: job.id,
      resumeId: resume.id,
      provider: "council",
      model: "council",
      fitScore: r.analysis.fitScore,
      fitDelta: r.analysis.fitDelta ?? 0,
      matchReasoning: r.analysis.matchReasoning,
      gaps: r.analysis.gaps,
      skills: r.analysis.skills,
      signals: r.analysis.signals,
      latencyMs: Date.now() - t0,
      trace: r.trace,
    });
    audit({
      userId: s.userId,
      action: "analysis_council",
      targetType: "analysis",
      targetId: inserted.id,
      ip: ipFrom(req),
      ua: uaFrom(req),
    });
    return NextResponse.json({ analysisId: inserted.id, ...r.analysis });
  }

  // Single provider: streaming reasoning while we generate the structured
  // result in parallel. Reasoning stream is purely UI candy; truth-of-record
  // is the structured analysis row written at the end.
  const { model, modelName } = await getModel(s.userId, provider as ProviderId);

  // Kick off the structured generation (non-streaming → faster total).
  const structuredPromise = generateObject({
    model,
    schema: JobAnalysisSchema,
    prompt,
  });

  // Spool the reasoning text in parallel so the console feels alive.
  const reasoningStream = streamText({
    model,
    prompt: `Briefly (3-5 short bullet lines) describe how you'll evaluate this candidate against the JD. Don't output JSON, just trace lines like "▸ extract requirements ... ✓".\n\nJD:\n${redactedJd.slice(0, 1200)}`,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Forward reasoning chunks as SSE.
        const reader = reasoningStream.textStream.getReader();
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          controller.enqueue(encoder.encode(`event: trace\ndata: ${JSON.stringify(value)}\n\n`));
        }
        // Wait for structured output, then persist + emit final.
        const { object } = await structuredPromise;
        const inserted = await insertAnalysis({
          jobId: job.id,
          resumeId: resume.id,
          provider: provider as ProviderId,
          model: modelName,
          fitScore: object.fitScore,
          fitDelta: object.fitDelta ?? 0,
          matchReasoning: object.matchReasoning,
          gaps: object.gaps,
          skills: object.skills,
          signals: object.signals,
          latencyMs: Date.now() - t0,
          trace: { provider, modelName },
        });
        audit({
          userId: s.userId,
          action: "analysis_single",
          targetType: "analysis",
          targetId: inserted.id,
          ip: ipFrom(req),
          ua: uaFrom(req),
        });
        controller.enqueue(
          encoder.encode(
            `event: result\ndata: ${JSON.stringify({ analysisId: inserted.id, ...object })}\n\n`,
          ),
        );
        controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
      } catch (err) {
        logger.warn({ err, jobId: job.id }, "analyze failed");
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              message: err instanceof Error ? err.message : String(err),
            })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
