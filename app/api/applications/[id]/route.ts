import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/guard";
import { upsertApplication } from "@/lib/db/queries/application";
import { audit } from "@/lib/audit";
import { parseJson, ipFrom, uaFrom } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `id` here is the analysis id (one application per analysis).
 */
const Body = z
  .object({
    status: z.enum(["ready", "applied", "interviewing", "offer", "rejected"]).optional(),
    appliedAt: z.coerce.date().optional(),
    notesMd: z.string().max(8_000).optional(),
    evaluatedMd: z.string().max(8_000).optional(),
  })
  .strict();

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.res;
  try {
    const out = await upsertApplication(s.userId, id, parsed.data);
    audit({
      userId: s.userId,
      action: "application_updated",
      targetType: "application",
      targetId: out.id,
      ip: ipFrom(req),
      ua: uaFrom(req),
    });
    return NextResponse.json({ application: out });
  } catch (err) {
    if (err instanceof Error && err.message === "not found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw err;
  }
}
