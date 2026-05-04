import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/guard";
import { parseJson, ipFrom, uaFrom } from "@/lib/validate";
import { insertJob } from "@/lib/db/queries/job";
import { audit } from "@/lib/audit";
import { checkRate } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PostSchema = z
  .object({
    company: z.string().min(1).max(120),
    role: z.string().min(1).max(160),
    location: z.string().max(120).optional(),
    salaryLowUsd: z.number().int().min(0).max(10_000_000).optional(),
    salaryHighUsd: z.number().int().min(0).max(10_000_000).optional(),
    jdText: z.string().min(40).max(20_000),
    sourceUrl: z.string().url().optional(),
    tags: z.array(z.string()).max(10).optional(),
  })
  .strict();

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await checkRate({ bucket: "user", key: `jobs:${s.userId}` });
  if (!rl.ok) return NextResponse.json({ error: "Rate limited", reset: rl.reset }, { status: 429 });

  const parsed = await parseJson(req, PostSchema);
  if (!parsed.ok) return parsed.res;

  const job = await insertJob({
    userId: s.userId,
    company: parsed.data.company,
    role: parsed.data.role,
    location: parsed.data.location,
    salaryLowUsd: parsed.data.salaryLowUsd,
    salaryHighUsd: parsed.data.salaryHighUsd,
    jdText: parsed.data.jdText,
    sourceUrl: parsed.data.sourceUrl,
    tags: parsed.data.tags,
  });

  audit({
    userId: s.userId,
    action: "job_created",
    targetType: "job",
    targetId: job.id,
    ip: ipFrom(req),
    ua: uaFrom(req),
  });

  return NextResponse.json({ id: job.id });
}
