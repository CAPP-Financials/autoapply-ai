/**
 * Sign-in stub — Phase 3 replaces with Better Auth.
 */
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="bg-bg-0 flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-6">
        <div className="label mb-2">sign in</div>
        <h1 className="text-2xl font-extrabold">Welcome back.</h1>
        <p className="text-fg-2 mt-2 text-[12px]">
          Auth lands in Phase 3 (Better Auth · magic link + OAuth). Until then, jump into the demo.
        </p>
        <Link
          href="/resume"
          className="bg-accent text-bg-0 mt-4 inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-xs font-semibold tracking-[0.04em] uppercase"
        >
          Continue to demo →
        </Link>
      </div>
    </main>
  );
}
