import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userProviderKeys } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/guard";
import { audit } from "@/lib/audit";
import { ipFrom, uaFrom } from "@/lib/validate";
import type { ProviderId } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID = new Set(["anthropic", "openai", "google", "groq", "openrouter", "ollama"]);

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider } = await ctx.params;
  if (!VALID.has(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  await db
    .delete(userProviderKeys)
    .where(
      and(
        eq(userProviderKeys.userId, s.userId),
        eq(userProviderKeys.provider, provider as ProviderId),
      ),
    );

  audit({
    userId: s.userId,
    action: "provider_key_deleted",
    targetType: "provider",
    targetId: provider,
    ip: ipFrom(req),
    ua: uaFrom(req),
  });

  return NextResponse.json({ ok: true });
}
