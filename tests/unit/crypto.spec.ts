import { describe, it, expect } from "vitest";

/**
 * BYOK key custody — the highest-stakes code in the repo and, until now, the
 * only untested module with real I/O. lib/crypto.ts delegates to pgcrypto, so
 * a stub DATABASE_URL made it untestable and therefore untested.
 *
 * Skipping is allowed locally (a dev may not have a DB yet) but is a hard
 * failure in CI — a security test that silently skips is worse than none.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = Boolean(url) && !url.includes("stub");
const isCI = Boolean(process.env.CI);

if (isCI && !hasRealDb) {
  throw new Error(
    "CI must run crypto tests against a real Postgres with pgcrypto. " +
      `DATABASE_URL is missing or a stub: "${url}"`,
  );
}

describe.skipIf(!hasRealDb)("BYOK key encryption (pgcrypto)", () => {
  it("round-trips a provider key unchanged", async () => {
    const { encryptSecret, decryptSecret } = await import("@/lib/crypto");
    const key = "sk-ant-api03-not-a-real-key-0123456789";
    const ct = await encryptSecret(key);
    expect(await decryptSecret(ct)).toBe(key);
  });

  it("stores ciphertext, never the plaintext key", async () => {
    const { encryptSecret } = await import("@/lib/crypto");
    const key = "sk-ant-api03-not-a-real-key-0123456789";
    const ct = await encryptSecret(key);
    // The bytes that land in user_provider_keys.encrypted_key must not
    // contain the key. This is the regression that would leak every user's
    // credential via a DB dump.
    expect(Buffer.from(ct).toString("utf8")).not.toContain(key);
    expect(Buffer.from(ct).toString("utf8")).not.toContain("sk-ant");
    expect(ct.length).toBeGreaterThan(0);
  });

  it("produces different ciphertext for the same input (salted)", async () => {
    const { encryptSecret } = await import("@/lib/crypto");
    const a = await encryptSecret("same-key-value");
    const b = await encryptSecret("same-key-value");
    // pgp_sym_encrypt salts by default; identical ciphertext would mean an
    // attacker could match users who share a provider key.
    expect(Buffer.from(a).toString("hex")).not.toBe(Buffer.from(b).toString("hex"));
  });

  it("refuses to decrypt with the wrong key", async () => {
    const { encryptSecret } = await import("@/lib/crypto");
    const { sql } = await import("drizzle-orm");
    const { db } = await import("@/lib/db/client");
    const ct = await encryptSecret("sk-secret-value");
    await expect(
      db.execute(sql`select pgp_sym_decrypt(${Buffer.from(ct)}::bytea, ${"wrong-passphrase"}) as pt`),
    ).rejects.toThrow();
  });
});
