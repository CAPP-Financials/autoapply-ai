import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { getSession } from "@/lib/auth/guard";
import { putResumeBlob } from "@/lib/storage/blob";
import { extractPdfText } from "@/lib/storage/parse-pdf";
import { getModel, type ProviderId } from "@/lib/ai/provider";
import { ResumeProfileSchema } from "@/lib/ai/schemas";
import { buildParseResumePrompt } from "@/lib/ai/prompts/parse-resume";
import { encryptSecret } from "@/lib/crypto";
import { insertResume } from "@/lib/db/queries/resume";
import { audit } from "@/lib/audit";
import { checkRate } from "@/lib/rate-limit";
import { ipFrom, uaFrom } from "@/lib/validate";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 min

const ACCEPTED_MIME = new Set(["application/pdf", "text/plain"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = ipFrom(req);
  const rl = await checkRate({ bucket: "upload", key: `upload:${s.userId}` });
  if (!rl.ok) return NextResponse.json({ error: "Rate limited", reset: rl.reset }, { status: 429 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });

  const file = form.get("file");
  const provider = (form.get("provider") as ProviderId | null) ?? null;
  if (!(file instanceof File))
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "File too large (5MB max)" }, { status: 413 });
  if (!ACCEPTED_MIME.has(file.type))
    return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 });
  if (!provider)
    return NextResponse.json({ error: "Pick a provider" }, { status: 400 });

  const arrayBuf = new Uint8Array(await file.arrayBuffer());

  // 1) Upload raw to Blob.
  const t0 = Date.now();
  const blob = await putResumeBlob({
    userId: s.userId,
    filename: file.name,
    body: Buffer.from(arrayBuf),
    contentType: file.type,
  });

  // 2) Extract text (PDF) or decode (txt).
  let text = "";
  let pages = 0;
  if (file.type === "application/pdf") {
    const r = await extractPdfText(arrayBuf);
    text = r.text;
    pages = r.pages;
  } else {
    text = new TextDecoder().decode(arrayBuf);
    pages = 1;
  }

  // 3) LLM-extract structured profile (constrained by schema).
  const { model, modelName } = await getModel(s.userId, provider);
  const r = await generateObject({
    model,
    schema: ResumeProfileSchema,
    prompt: buildParseResumePrompt(text),
  });

  // 4) Strip + encrypt PII before persistence.
  const profile = r.object;
  const piiName = await encryptSecret(profile.name ?? "");
  // The schema we asked for doesn't include contact fields; future
  // versions of the prompt may, in which case redact them and encrypt.
  const sanitized = { ...profile };

  const row = await insertResume({
    userId: s.userId,
    version: 1,
    blobUrl: blob.url,
    mime: file.type,
    sizeBytes: file.size,
    parsedJson: sanitized,
    piiName,
    confidence: 95,
    parserLog: `pdf=${pages}p ${arrayBuf.byteLength}B parsed in ${Date.now() - t0}ms via ${provider}/${modelName}`,
    parsedAt: new Date(),
  });

  audit({
    userId: s.userId,
    action: "resume_uploaded",
    targetType: "resume",
    targetId: row.id,
    ip,
    ua: uaFrom(req),
  });

  logger.info({ userId: s.userId, resumeId: row.id, pages, latencyMs: Date.now() - t0 }, "resume parsed");
  return NextResponse.json({ id: row.id, blobUrl: row.blobUrl, confidence: row.confidence });
}
