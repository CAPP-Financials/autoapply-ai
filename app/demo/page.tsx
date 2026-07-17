/**
 * Public demo — 100% fixture replay, per the project's hard constraint.
 *
 * Lives outside the (app) group deliberately: that tree calls requireSession()
 * and would bounce an anonymous visitor to /sign-in. This renders the exact
 * same <ResultsView> the live dashboard uses, against MOCK_JOBS, with no auth
 * and no provider key. No AI provider is called from this path.
 */
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { ResultsView } from "@/components/results/ResultsView";
import { MOCK_JOBS } from "@/lib/data/mock";
import { computeKpis } from "@/lib/data/view";

export const metadata = { title: "AutoApply.ai — demo" };

export default function DemoPage() {
  const jobs = MOCK_JOBS;
  const kpis = computeKpis(jobs);

  return (
    <Shell
      active="results"
      crumbs={["autoapply", "demo", "sample batch · 6 jobs"]}
      user={{ name: "DEMO USER", resumeMeta: "sample_resume.pdf" }}
      configuredProviders={["fixture replay"]}
    >
      <DemoBanner />
      <ResultsView jobs={jobs} kpis={kpis} batchLabel="sample batch" />
    </Shell>
  );
}

function DemoBanner() {
  return (
    <div className="border-accent-line bg-accent-soft mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 border px-4 py-2.5">
      <span className="text-accent text-[10px] font-semibold tracking-[0.16em] uppercase">
        Demo
      </span>
      <span className="text-fg-2 text-xs">
        Sample data — no account, no API key, nothing sent to a model.
      </span>
      <Link href="/sign-up" className="text-accent ml-auto text-xs underline underline-offset-2">
        Run it on your own resume →
      </Link>
    </div>
  );
}
