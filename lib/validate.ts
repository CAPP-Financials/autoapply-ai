/**
 * Request validation helper — every API route handler runs through this.
 * Returns a typed result or a NextResponse with 400 + zod errors.
 */
import { NextResponse } from "next/server";
import type { z } from "zod";

export async function parseJson<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; res: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      ok: false,
      res: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
  const r = schema.safeParse(body);
  if (!r.success) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "Validation failed", issues: r.error.format() },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: r.data };
}

export function ipFrom(req: Request): string | undefined {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") ?? undefined;
}

export function uaFrom(req: Request): string | undefined {
  return req.headers.get("user-agent") ?? undefined;
}
