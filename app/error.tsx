"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <main className="bg-bg-0 text-fg-0 flex min-h-screen items-center justify-center px-6">
      <div className="card max-w-lg p-8">
        <span className="label">runtime error</span>
        <h1 className="mt-2 text-2xl font-extrabold">Something went sideways.</h1>
        <p className="text-fg-2 mt-3 leading-relaxed">
          The exception has been logged. You can retry the action below; if it persists, head back
          to the home page and ping support.
        </p>
        {error.digest && (
          <p className="text-fg-3 mt-3 text-[10px] tracking-[0.12em] uppercase">
            ref · {error.digest}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <button
            onClick={reset}
            className="bg-accent text-bg-0 inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-xs font-semibold tracking-[0.04em] uppercase"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border-line text-fg-1 hover:bg-bg-1 inline-flex items-center gap-2 rounded-[4px] border px-4 py-2 text-xs tracking-[0.04em] uppercase"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
