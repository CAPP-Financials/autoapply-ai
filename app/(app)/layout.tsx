/**
 * Authenticated app shell.
 *
 * Until Phase 3 (Better Auth) lands, this layout renders an unauth-friendly
 * shell using fixture user data so the screens stay reachable end-to-end.
 * Phase 3 swaps the mock user for `await getSession()` and adds a redirect.
 */
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
