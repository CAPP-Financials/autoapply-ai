/**
 * Screen 04 — Job detail (live).
 *
 * Both lookups are userId-scoped, so a job belonging to someone else 404s
 * rather than rendering. The fixture version did `MOCK_JOBS.find()`, which
 * could only ever 404 on the six hardcoded ids.
 */
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/guard";
import { Shell } from "@/components/layout/Shell";
import { JobDetail } from "@/components/job/JobDetail";
import { getJobById } from "@/lib/db/queries/job";
import { getAnalysisForJob } from "@/lib/db/queries/analysis";
import { toJobView } from "@/lib/data/view";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireSession();

  const job = await getJobById(s.userId, id);
  if (!job) notFound();

  const analysis = await getAnalysisForJob(s.userId, id);
  if (!analysis) notFound(); // job exists but hasn't been analyzed yet

  const view = toJobView({
    analysis,
    company: job.company,
    role: job.role,
    location: job.location,
    salaryLowUsd: job.salaryLowUsd,
    salaryHighUsd: job.salaryHighUsd,
    tags: job.tags,
  });

  return (
    <Shell
      active="results"
      crumbs={["autoapply", "results", job.company.toLowerCase(), job.role.toLowerCase()]}
      user={{ name: s.name.toUpperCase() }}
    >
      <JobDetail job={view} provider={analysis.provider} />
    </Shell>
  );
}
