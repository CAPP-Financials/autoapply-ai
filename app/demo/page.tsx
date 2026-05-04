/**
 * Public demo entry. Redirects into the same screens the auth-protected
 * shell renders, but with fixture data and no provider key requirement.
 *
 * In Phase 14 we'll split /demo into a fully bypass-auth tree; for now the
 * `/(app)/*` routes already render against MOCK_JOBS, so a redirect is fine.
 */
import { redirect } from "next/navigation";

export default function DemoEntry() {
  redirect("/resume");
}
