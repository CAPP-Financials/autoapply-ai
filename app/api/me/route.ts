import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";
import { listConfiguredProviders } from "@/lib/ai/provider";
import { latestResume } from "@/lib/db/queries/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null });
  const [providers, resume] = await Promise.all([
    listConfiguredProviders(s.userId),
    latestResume(s.userId),
  ]);
  return NextResponse.json({
    user: { id: s.userId, email: s.email, name: s.name },
    providers,
    hasResume: Boolean(resume),
  });
}
