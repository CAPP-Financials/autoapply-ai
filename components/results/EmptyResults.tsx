import Link from "next/link";
import { Card } from "@/components/primitives/Card";
import { Label } from "@/components/primitives/Label";

/**
 * The state every real user starts in and the fixtures never showed:
 * zero analyses. Rendering the dashboard chrome against an empty array
 * produces NaN KPIs and an empty plot, so this stands in instead.
 */
export function EmptyResults() {
  return (
    <Card ticks className="relative mx-auto mt-16 max-w-[520px] p-8 text-center">
      <Label>No analyses yet</Label>
      <h1 className="mt-3 mb-2 text-2xl font-extrabold tracking-[-0.02em]">
        Nothing scored yet<span className="caret ml-1 align-baseline" />
      </h1>
      <p className="text-fg-2 mx-auto max-w-[380px]">
        Upload a resume, paste a job description, and the fit score lands here.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/resume" className="text-accent border-accent-line hover:bg-bg-3 border px-4 py-2 text-xs tracking-[0.04em] uppercase">
          Upload resume
        </Link>
        <Link href="/jobs" className="text-fg-2 border-line hover:bg-bg-3 border px-4 py-2 text-xs tracking-[0.04em] uppercase">
          Paste a JD
        </Link>
      </div>
    </Card>
  );
}
