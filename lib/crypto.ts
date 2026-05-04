/**
 * pgcrypto wrappers for symmetric encryption of user-supplied AI provider
 * keys. The key never leaves the server boundary; encryption is delegated
 * to Postgres so the plaintext touches RAM only on the server, never in
 * an ORM-level intermediate.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";

function passphrase(): string {
  const k = env.KEY_ENCRYPTION_KEY;
  if (!k) throw new Error("KEY_ENCRYPTION_KEY missing");
  return k;
}

/**
 * Encrypt a plaintext string and return the ciphertext bytea suitable for
 * inserting into a bytea column. The raw ciphertext is returned as a
 * Buffer / Uint8Array.
 */
export async function encryptSecret(plaintext: string): Promise<Uint8Array> {
  const k = passphrase();
  const rows = await db.execute<{ ct: Uint8Array }>(
    sql`select pgp_sym_encrypt(${plaintext}, ${k}) as ct`,
  );
  // postgres-js returns rows as plain arrays in execute(); access [0].
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = (rows as any)[0] ?? rows;
  return row.ct as Uint8Array;
}

/**
 * Decrypt ciphertext bytes back to plaintext. Throws if the key is wrong
 * or the bytes are corrupted.
 */
export async function decryptSecret(ciphertext: Uint8Array): Promise<string> {
  const k = passphrase();
  const rows = await db.execute<{ pt: string }>(
    sql`select pgp_sym_decrypt(${ciphertext}::bytea, ${k}) as pt`,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = (rows as any)[0] ?? rows;
  return row.pt as string;
}

/**
 * Stable last-4 hint used by the UI to identify a configured key without
 * decrypting it. Computed once at insert and stored in `key_hint`.
 */
export function keyHint(plaintext: string): string {
  return plaintext.slice(-4).padStart(4, "•");
}
