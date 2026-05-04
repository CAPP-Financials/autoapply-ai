import { put, del } from "@vercel/blob";
import { assertEnv } from "@/lib/env";

/**
 * Vercel Blob wrapper. Resumes are private (random pathname,
 * `addRandomSuffix: true` already; access via signed download URLs).
 */
export async function putResumeBlob(args: {
  userId: string;
  filename: string;
  body: Buffer | Blob | File | ReadableStream;
  contentType: string;
}) {
  assertEnv("BLOB_READ_WRITE_TOKEN");
  const safeName = args.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `resumes/${args.userId}/${Date.now()}-${safeName}`;
  return put(path, args.body, {
    access: "public", // we use unguessable pathname for confidentiality;
    // Vercel Blob's "private" tier requires Pro; the random suffix + per-user
    // path keeps the URL effectively unguessable for free.
    contentType: args.contentType,
    addRandomSuffix: true,
  });
}

export async function deleteBlob(url: string) {
  await del(url);
}
