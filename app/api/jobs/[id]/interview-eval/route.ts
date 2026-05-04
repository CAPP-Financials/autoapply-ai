import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { db } from "@/lib/db/client";
import { artifacts } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/guard";
import { getJobById } from "@/lib/db/queries/job";
import { getAnalysisForJob } from "@/lib/db/queries/analysis";
import { getModel, type ProviderId } from "@/lib/ai/provider";
import { InterviewEvalSchema } from "@/lib/ai/schemas";
import { buildInterviewEvalPrompt } from "@/lib/ai/prompts/interview-eval";
import { audit } from "@/lib/audit";
import { checkRate } from "@/lib/rate-limit";
import { parseJson, ipFrom, uaFrom } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const Body = z
  .object({
    provider: z.enum(["anthropic", "openai", "google", "groq", "openrouter", "ollama"]),
    notes: z.string().min(20).max(8_000),
  })
  .strict();

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await checkRate({ bucket: "analyze", key: `iv:${s.userId}` });
  if (!rl.ok) return NextResponse.json({ error: "Rate limited", reset: rl.reset }, { status: 429 });

  const { id } = await ctx.params;
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.res;

  const [job, analysis] = await Promise.all([
    getJobById(s.userId, id),
    getAnalysisForJob(s.userId, id),
  ]);
  if (!job || !analysis) return NextResponse.json({ error: "Analyze first" }, { status: 412 });

  const { model, modelName } = await getModel(s.userId, parsed.data.provider as ProviderId);
  const r = await generateObject({
    model,
    schema: InterviewEvalSchema,
    prompt: buildInterviewEvalPrompt({
      notes: parsed.data.notes,
      company: job.company,
      role: job.role,
      analysis: {
        fitScore: analysis.fitScore,
        fitDelta: analysis.fitDelta,
        matchReasoning: analysis.matchReasoning ?? "",
        skills: analysis.skills ?? [],
        gaps: analysis.gaps ?? [],
        signals: analysis.signals ?? [],
      },
    }),
  });

  const md = `${r.object.evaluation}\n\nSignals:\n${r.object.signals
    .map((s) => `- ${s.label}: ${s.score}`)
    .join("\n")}\n\nNext step: ${r.object.recommended_next_step}`;
  const [art] = await db
    .insert(artifacts)
    .values({
      analysisId: analysis.id,
      kind: "interview_eval",
      contentMd: md,
      generatedByProvider: parsed.data.provider as ProviderId,
      generatedByModel: modelName,
    })
    .returning();

  audit({
    userId: s.userId,
    action: "interview_eval_generated",
    targetType: "artifact",
    targetId: art.id,
    ip: ipFrom(req),
    ua: uaFrom(req),
  });
  return NextResponse.json({ id: art.id, contentMd: md, signals: r.object.signals });
}
