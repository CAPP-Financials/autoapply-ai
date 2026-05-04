import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { artifacts } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/guard";
import { getJobById } from "@/lib/db/queries/job";
import { latestResume } from "@/lib/db/queries/resume";
import { getAnalysisForJob } from "@/lib/db/queries/analysis";
import { getModel, type ProviderId } from "@/lib/ai/provider";
import { CoverLetterSchema, type ResumeProfile } from "@/lib/ai/schemas";
import { buildCoverLetterPrompt } from "@/lib/ai/prompts/cover-letter";
import { audit } from "@/lib/audit";
import { checkRate } from "@/lib/rate-limit";
import { parseJson, ipFrom, uaFrom } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const Body = z
  .object({
    provider: z.enum(["anthropic", "openai", "google", "groq", "openrouter", "ollama"]),
  })
  .strict();

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await checkRate({ bucket: "analyze", key: `cover:${s.userId}` });
  if (!rl.ok) return NextResponse.json({ error: "Rate limited", reset: rl.reset }, { status: 429 });

  const { id } = await ctx.params;
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.res;

  const [job, resume, analysis] = await Promise.all([
    getJobById(s.userId, id),
    latestResume(s.userId),
    getAnalysisForJob(s.userId, id),
  ]);
  if (!job || !resume?.parsedJson || !analysis) {
    return NextResponse.json({ error: "Need resume + analysis first" }, { status: 412 });
  }

  const { model, modelName } = await getModel(s.userId, parsed.data.provider as ProviderId);
  const r = await generateObject({
    model,
    schema: CoverLetterSchema,
    prompt: buildCoverLetterPrompt({
      profile: resume.parsedJson as ResumeProfile,
      jdText: job.jdText,
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

  const md = `${r.object.greeting}\n\n${r.object.body}\n\n${r.object.closing}`;
  // Replace any prior cover-letter for the same analysis.
  await db.delete(artifacts).where(eq(artifacts.analysisId, analysis.id));
  const [art] = await db
    .insert(artifacts)
    .values({
      analysisId: analysis.id,
      kind: "cover_letter",
      contentMd: md,
      generatedByProvider: parsed.data.provider as ProviderId,
      generatedByModel: modelName,
    })
    .returning();

  audit({
    userId: s.userId,
    action: "cover_letter_generated",
    targetType: "artifact",
    targetId: art.id,
    ip: ipFrom(req),
    ua: uaFrom(req),
  });

  return NextResponse.json({ id: art.id, contentMd: md });
}
