import { NextResponse } from "next/server";

/**
 * Liveness probe. Cheap, no DB read — just confirms the function ran.
 * For readiness (DB + Redis pings) add a separate /api/readyz when needed.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: "autoapply-ai",
    version: process.env.npm_package_version ?? "0.1.0",
    time: new Date().toISOString(),
  });
}
