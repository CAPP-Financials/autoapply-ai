import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./server";

/**
 * Branded ID type — every DB query helper takes `UserId`, never raw string,
 * so a user-scoped query that forgot the `where userId = ...` filter fails
 * to type-check.
 */
export type UserId = string & { readonly __userId: unique symbol };

export type AuthedSession = {
  userId: UserId;
  email: string;
  name: string;
};

/**
 * Server-side: get the current session or null. Doesn't redirect.
 * Use in route handlers when you want to render a different response
 * for unauth users.
 */
export async function getSession(): Promise<AuthedSession | null> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return null;
  return {
    userId: session.user.id as UserId,
    email: session.user.email,
    name: session.user.name,
  };
}

/**
 * Server-side: require a session. Redirects to /sign-in if missing.
 * Returns the session in the protected branch.
 */
export async function requireSession(redirectTo = "/sign-in"): Promise<AuthedSession> {
  const s = await getSession();
  if (!s) redirect(redirectTo);
  return s;
}
