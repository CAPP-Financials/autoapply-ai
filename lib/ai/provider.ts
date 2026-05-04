/**
 * Provider abstraction.
 *
 * The rest of the app calls `getModel(userId, providerId, modelName?)`
 * and gets back a Vercel AI SDK `LanguageModel` ready to feed into
 * `generateText` / `streamText` / `generateObject` / `streamObject`.
 *
 * BYOK: every call decrypts the user's stored key on the fly and
 * threads it through the provider's factory. No keys leak to logs;
 * the decrypted plaintext only lives in the closure.
 */
import { eq, and } from "drizzle-orm";
import type { LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { db } from "@/lib/db/client";
import { userProviderKeys } from "@/lib/db/schema";
import { decryptSecret } from "@/lib/crypto";
import { logger } from "@/lib/logger";

export type ProviderId =
  | "anthropic"
  | "openai"
  | "google"
  | "groq"
  | "openrouter"
  | "ollama";

export type ProviderInfo = {
  id: ProviderId;
  label: string;
  /** Default model surfaced in the UI. Users may override. */
  defaultModel: string;
  /** Free-tier-friendly alternative shown as a hint. */
  freeTierHint?: string;
};

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic Claude",
    defaultModel: "claude-3-5-sonnet-latest",
    freeTierHint: "Claude free credits or Console (USD pricing)",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o-mini",
    freeTierHint: "no free tier; pay-per-token",
  },
  google: {
    id: "google",
    label: "Google AI Studio",
    defaultModel: "gemini-1.5-flash-latest",
    freeTierHint: "1.5 Flash: 15 rpm + 1.5M tok/day free",
  },
  groq: {
    id: "groq",
    label: "Groq",
    defaultModel: "llama-3.1-70b-versatile",
    freeTierHint: "Llama 3.1 / Mixtral free tier",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    defaultModel: "openai/gpt-4o-mini",
    freeTierHint: "Pay-per-use, hundreds of models incl. free ones",
  },
  ollama: {
    id: "ollama",
    label: "Ollama (self-hosted)",
    defaultModel: "llama3.2",
    freeTierHint: "Free, local — needs OLLAMA_BASE_URL set",
  },
};

/**
 * Look up the decrypted user key for a provider. Throws if missing.
 * Updates `last_used_at` as a side effect (best-effort; ignored on error).
 */
async function fetchUserKey(userId: string, provider: ProviderId): Promise<string> {
  const rows = await db
    .select()
    .from(userProviderKeys)
    .where(and(eq(userProviderKeys.userId, userId), eq(userProviderKeys.provider, provider)))
    .limit(1);
  const row = rows[0];
  if (!row) {
    throw new Error(
      `No ${provider} key configured. Add one in Settings → Providers.`,
    );
  }
  // Update last-used asynchronously; failures are not fatal.
  db.update(userProviderKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(userProviderKeys.id, row.id))
    .catch((err: unknown) => logger.warn({ err }, "failed to update lastUsedAt"));
  return decryptSecret(row.encryptedKey);
}

/**
 * Build a LanguageModel for the given user + provider. The optional
 * `model` arg lets callers override the default model name.
 */
export async function getModel(
  userId: string,
  provider: ProviderId,
  modelName?: string,
): Promise<{ model: LanguageModel; modelName: string }> {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error(`Unknown provider: ${provider}`);
  const name = modelName ?? cfg.defaultModel;
  const apiKey = await fetchUserKey(userId, provider);

  let model: LanguageModel;
  switch (provider) {
    case "anthropic":
      model = createAnthropic({ apiKey })(name);
      break;
    case "openai":
      model = createOpenAI({ apiKey })(name);
      break;
    case "google":
      model = createGoogleGenerativeAI({ apiKey })(name);
      break;
    case "groq":
      model = createGroq({ apiKey })(name);
      break;
    case "openrouter":
      // OpenRouter is OpenAI-compatible.
      model = createOpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" })(name);
      break;
    case "ollama": {
      // Ollama exposes an OpenAI-compatible endpoint at /v1.
      // The "key" stored is the base URL (e.g. http://localhost:11434).
      const baseURL = apiKey.replace(/\/+$/, "") + "/v1";
      model = createOpenAI({ apiKey: "ollama", baseURL })(name);
      break;
    }
    default: {
      // Exhaustive check
      const _: never = provider;
      throw new Error(`Unhandled provider: ${String(_)}`);
    }
  }

  return { model, modelName: name };
}

/**
 * Tells the UI which providers a user has configured.
 * Returns just the provider IDs + last-used timestamps; never the keys.
 */
export async function listConfiguredProviders(
  userId: string,
): Promise<{ provider: ProviderId; lastUsedAt: Date | null; keyHint: string | null }[]> {
  const rows = await db
    .select({
      provider: userProviderKeys.provider,
      lastUsedAt: userProviderKeys.lastUsedAt,
      keyHint: userProviderKeys.keyHint,
    })
    .from(userProviderKeys)
    .where(eq(userProviderKeys.userId, userId));
  return rows as { provider: ProviderId; lastUsedAt: Date | null; keyHint: string | null }[];
}
