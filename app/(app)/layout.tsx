/**
 * Authenticated app shell.
 *
 * This check is defense-in-depth, NOT the protection boundary. Layouts don't
 * re-execute on every client navigation, so a page that relies solely on this
 * can leak. Each page calls requireSession() itself — it needs the userId to
 * scope its query anyway, so the auth gate and the query parameter are the
 * same call.
 *
 * The real gate order is: proxy.ts (cheap cookie check) → this → per-page
 * requireSession() → per-query `where userId = ...`.
 */
import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/guard";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
