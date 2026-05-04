/**
 * Better Auth catch-all handler.
 * Mounts under /api/auth/* — e.g. /api/auth/sign-in/magic-link, /api/auth/callback/github.
 */
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/server";

export const { GET, POST } = toNextJsHandler(auth);
