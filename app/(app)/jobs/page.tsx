/**
 * Screen 02 — Jobs intake + analyzing.
 * JD textarea on the left, streaming console + queue on the right.
 * Phase 7/8 wires real `streamText` and resumable batches.
 */
import { requireSession } from "@/lib/auth/guard";
import { Shell } from "@/components/layout/Shell";
import { Card, CardSectionHeader } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Label } from "@/components/primitives/Label";
import { Input, Textarea } from "@/components/primitives/Input";
import { AnalysisConsole } from "@/components/console/AnalysisConsole";
import { listConfiguredProviders } from "@/lib/ai/provider";

const SAMPLE_JD = `Stripe is hiring Software Engineer III on the Payments Reliability team.

Responsibilities:
• Design and ship distributed systems handling high-volume transactions
• Own end-to-end services in Ruby and TypeScript
• Partner with risk + treasury teams on financial correctness

Requirements:
• 5+ years of backend engineering
• Production Ruby experience (mandatory)
• Strong distributed systems & Postgres fundamentals
• Experience designing public APIs at scale
• Bonus: payments / financial-systems background`;

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const s = await requireSession();
  const providers = await listConfiguredProviders(s.userId);

  const queue = [
    { co: "Linear", role: "Staff Frontend Engineer", state: "done" as const, pct: 100, fit: 92 },
    { co: "Notion", role: "Senior Full-Stack (AI)", state: "done" as const, pct: 100, fit: 87 },
    { co: "Vercel", role: "Frontend Engineer", state: "done" as const, pct: 100, fit: 81 },
    { co: "Stripe", role: "Software Engineer III", state: "running" as const, pct: 64, fit: null },
    { co: "Supabase", role: "Senior Backend Engineer", state: "queued" as const, pct: 0, fit: null },
    { co: "Raycast", role: "Product Engineer", state: "queued" as const, pct: 0, fit: null },
  ];

  return (
    <Shell
      active="jobs"
      crumbs={["autoapply", "jobs", "batch · 6 postings"]}
      user={{ name: s.name.toUpperCase() }}
      configuredProviders={providers.map((p) => String(p.provider))}
      defaultProvider="claude-3.5"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="overflow-hidden">
          <CardSectionHeader left="paste jd" right="JOB 04 OF 06 · STRIPE" />
          <div className="p-4.5">
            <div className="mb-3 grid grid-cols-2 gap-2.5">
              <div>
                <Label className="mb-1 block">company</Label>
                <Input defaultValue="Stripe" />
              </div>
              <div>
                <Label className="mb-1 block">role</Label>
                <Input defaultValue="Software Engineer III" />
              </div>
            </div>
            <Label className="mb-1 block">job description</Label>
            <Textarea
              defaultValue={SAMPLE_JD}
              rows={14}
              className="resize-y font-mono text-[12px] leading-relaxed"
            />

            <div className="text-fg-3 mt-2.5 flex items-center justify-between text-[11px]">
              <span>{SAMPLE_JD.length} chars · ~{SAMPLE_JD.split(/\s+/).length} tokens</span>
              <span>+ paste another · or upload .csv</span>
            </div>

            <div className="mt-3.5 flex gap-2.5">
              <Button variant="primary">Analyze with claude-3.5 →</Button>
              <Button variant="ghost">+ Add to queue</Button>
            </div>
          </div>
        </Card>

        <AnalysisConsole provider="claude-3.5" initialQueue={queue} />
      </div>
    </Shell>
  );
}
