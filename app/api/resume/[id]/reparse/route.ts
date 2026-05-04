import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { getSession } from "@/lib/auth/guard";
import { getResumeById, updateResume } from "@/lib/db/queries/resume";
import { extractPdfText } from "@/lib/storage/parse-pdf";
import { getModel, type ProviderId } from "@/lib/ai/provider";
import { ResumeProfileSchema } from "@/lib/ai/schemas";
import { buildParseResumePrompt } from "@/lib/ai/prompts/parse-resume";
import { parseJson, ipFrom, uaFrom } from "@/lib/validate";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const Body = z
  .object({
    provider: z.enum(["anthropic", "openai", "google", "groq", "openrouter", "ollama"]),
  })
  .strict();

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.res;

  const r = await getResumeById(s.userId, id);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Re-fetch the blob and re-extract.
  const fileRes = await fetch(r.blobUrl);
  if (!fileRes.ok) return NextResponse.json({ error: "Blob fetch failed" }, { status: 502 });
  const buf = new Uint8Array(await fileRes.arrayBuffer());
  let text = "";
  if (r.mime === "application/pdf") text = (await extractPdfText(buf)).text;
  else text = new TextDecoder().decode(buf);

  const { model, modelName } = await getModel(s.userId, parsed.data.provider as ProviderId);
  const out = await generateObject({
    model,
    schema: ResumeProfileSchema,
    prompt: buildParseResumePrompt(text),
  });

  await updateResume(s.userId, id, {
    parsedJson: out.object,
    parsedAt: new Date(),
    parserLog: `reparsed via ${parsed.data.provider}/${modelName}`,
  });

  audit({
    userId: s.userId,
    action: "resume_reparsed",
    targetType: "resume",
    targetId: id,
    ip: ipFrom(req),
    ua: uaFrom(req),
  });
  return NextResponse.json({ ok: true });
}
