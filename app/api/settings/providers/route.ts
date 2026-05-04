import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userProviderKeys } from "@/lib/db/schema";
import { encryptSecret, keyHint } from "@/lib/crypto";
import { getSession } from "@/lib/auth/guard";
import { parseJson, ipFrom, uaFrom } from "@/lib/validate";
import { listConfiguredProviders, PROVIDERS, type ProviderId } from "@/lib/ai/provider";
import { audit } from "@/lib/audit";
import { checkRate } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PostSchema = z
  .object({
    provider: z.enum(["anthropic", "openai", "google", "groq", "openrouter", "ollama"]),
    apiKey: z.string().min(1).max(500),
  })
  .strict();

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await listConfiguredProviders(s.userId);
  return NextResponse.json({
    providers: list,
    available: PROVIDERS,
  });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = ipFrom(req);
  const r = await checkRate({ bucket: "user", key: `keys:${s.userId}` });
  if (!r.ok) {
    return NextResponse.json({ error: "Rate limited", reset: r.reset }, { status: 429 });
  }

  const parsed = await parseJson(req, PostSchema);
  if (!parsed.ok) return parsed.res;
  const { provider, apiKey } = parsed.data;

  // Server-side sanity check: no whitespace, no obvious leaks.
  if (apiKey.includes("\n") || apiKey.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Key looks malformed" }, { status: 400 });
  }

  const ciphertext = await encryptSecret(apiKey);
  const hint = keyHint(apiKey);

  // Upsert
  const existing = await db
    .select({ id: userProviderKeys.id })
    .from(userProviderKeys)
    .where(
      and(
        eq(userProviderKeys.userId, s.userId),
        eq(userProviderKeys.provider, provider as ProviderId),
      ),
    );
  if (existing[0]) {
    await db
      .update(userProviderKeys)
      .set({ encryptedKey: ciphertext, keyHint: hint })
      .where(eq(userProviderKeys.id, existing[0].id));
  } else {
    await db.insert(userProviderKeys).values({
      userId: s.userId,
      provider,
      encryptedKey: ciphertext,
      keyHint: hint,
    });
  }

  audit({
    userId: s.userId,
    action: existing[0] ? "provider_key_updated" : "provider_key_added",
    targetType: "provider",
    targetId: provider,
    ip,
    ua: uaFrom(req),
  });

  return NextResponse.json({ ok: true, provider, keyHint: hint });
}
