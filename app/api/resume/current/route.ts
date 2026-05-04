import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";
import { latestResume } from "@/lib/db/queries/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await latestResume(s.userId);
  if (!r) return NextResponse.json({ resume: null });
  return NextResponse.json({
    resume: {
      id: r.id,
      version: r.version,
      blobUrl: r.blobUrl,
      mime: r.mime,
      sizeBytes: r.sizeBytes,
      parsed: r.parsedJson,
      confidence: r.confidence,
      parserLog: r.parserLog,
      parsedAt: r.parsedAt,
    },
  });
}
