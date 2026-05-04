/**
 * Screen 04 — Job detail.
 * Header (with FitRing) · tabs (overview / cover letter / ATS resume /
 * interview notes) · skill radar · comp positioning · signals.
 *
 * Reads from MOCK_JOBS until Phase 6/9 wires real DB lookups.
 */
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { JobDetail } from "@/components/job/JobDetail";
import { MOCK_JOBS } from "@/lib/data/mock";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = MOCK_JOBS.find((j) => j.id === id);
  if (!job) notFound();

  return (
    <Shell
      active="results"
      crumbs={["autoapply", "results", job.company.toLowerCase(), job.jobTitle.toLowerCase()]}
      user={{ name: "JOHN SMITH", resumeMeta: "resume.v3 · 2 KB" }}
      configuredProviders={["claude-3.5", "gemini-2.0", "gpt-4o", "llm council"]}
      defaultProvider="claude-3.5"
    >
      <JobDetail job={job} provider="claude-3.5" />
    </Shell>
  );
}
