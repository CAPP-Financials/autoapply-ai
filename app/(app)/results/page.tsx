/**
 * Screen 03 — Results dashboard (live).
 *
 * Server Component: fetches the signed-in user's own analyses and hands them
 * to the shared <ResultsView>. The /demo route renders that same component
 * with fixtures, so the two screens cannot drift apart.
 */
import { requireSession } from "@/lib/auth/guard";
import { Shell } from "@/components/layout/Shell";
import { ResultsView } from "@/components/results/ResultsView";
import { EmptyResults } from "@/components/results/EmptyResults";
import { listAnalysesForUser } from "@/lib/db/queries/analysis";
import { listConfiguredProviders } from "@/lib/ai/provider";
import { toJobView, computeKpis } from "@/lib/data/view";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  // requireSession() is the auth boundary AND the query parameter — the same
  // call does both, so a page can't render without scoping its data.
  const s = await requireSession();

  const [rows, providers] = await Promise.all([
    listAnalysesForUser(s.userId),
    listConfiguredProviders(s.userId),
  ]);

  const jobs = rows.map(toJobView);
  const kpis = computeKpis(jobs);

  return (
    <Shell
      active="results"
      crumbs={["autoapply", "results", `${jobs.length} job${jobs.length === 1 ? "" : "s"}`]}
      user={{ name: s.name.toUpperCase() }}
      configuredProviders={providers.map((p) => String(p))}
    >
      {jobs.length === 0 ? (
        <EmptyResults />
      ) : (
        <ResultsView jobs={jobs} kpis={kpis} batchLabel="all time" />
      )}
    </Shell>
  );
}
