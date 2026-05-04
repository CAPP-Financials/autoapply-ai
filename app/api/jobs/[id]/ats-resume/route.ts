import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { db } from "@/lib/db/client";
import { artifacts } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/guard";
import { getJobById } from "@/lib/db/queries/job";
import { latestResume } from "@/lib/db/queries/resume";
import { getAnalysisForJob } from "@/lib/db/queries/analysis";
import { getModel, type ProviderId } from "@/lib/ai/provider";
import { ATSResumeSchema, type ResumeProfile } from "@/lib/ai/schemas";
import { buildATSResumePrompt } from "@/lib/ai/prompts/ats-resume";
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

function format(out: z.infer<typeof ATSResumeSchema>): string {
  const lines: string[] = [];
  lines.push("SUMMARY", out.summary, "", "CORE COMPETENCIES", out.coreCompetencies.join(" · "), "", "EXPERIENCE");
  for (const e of out.experience) {
    lines.push(`${e.title} — ${e.company} (${e.dates})`);
    for (const b of e.bullets) lines.push(`  • ${b}`);
    lines.push("");
  }
  return lines.join("\n");
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await checkRate({ bucket: "analyze", key: `ats:${s.userId}` });
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
    schema: ATSResumeSchema,
    prompt: buildATSResumePrompt({
      profile: resume.parsedJson as ResumeProfile,
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

  const text = format(r.object);
  const [art] = await db
    .insert(artifacts)
    .values({
      analysisId: analysis.id,
      kind: "ats_resume",
      contentMd: text,
      generatedByProvider: parsed.data.provider as ProviderId,
      generatedByModel: modelName,
    })
    .returning();

  audit({
    userId: s.userId,
    action: "ats_resume_generated",
    targetType: "artifact",
    targetId: art.id,
    ip: ipFrom(req),
    ua: uaFrom(req),
  });
  return NextResponse.json({ id: art.id, contentMd: text });
}
