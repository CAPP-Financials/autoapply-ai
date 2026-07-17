/**
 * Screen 03 — Results dashboard (presentation only).
 *
 * Data-source agnostic on purpose: the live dashboard passes userId-scoped DB
 * rows, /demo passes fixtures. Same pixels, one component, so the demo can't
 * drift from the real screen.
 */
"use client";

import { useState } from "react";
import { Card, CardSectionHeader } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Label } from "@/components/primitives/Label";
import { FitSalaryPlot } from "@/components/charts/FitSalaryPlot";
import { SkillHeatmap } from "@/components/charts/SkillHeatmap";
import { JobLedger } from "@/components/job/JobLedger";
import { fmtMoney, type CurrencyMode } from "@/lib/currency";
import type { JobView, Kpis } from "@/lib/data/view";

export function ResultsView({
  jobs,
  kpis,
  batchLabel,
}: {
  jobs: JobView[];
  kpis: Kpis;
  batchLabel: string;
}) {
  const [currency, setCurrency] = useState<CurrencyMode>("BOTH");
  const cycleCurrency = () =>
    setCurrency((c) => (c === "BOTH" ? "USD" : c === "USD" ? "INR" : "BOTH"));

  const sortedForPlot = [...jobs].sort((a, b) => b.fitScore - a.fitScore);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={cycleCurrency}>
          {currency === "BOTH" ? "$ · ₹" : currency === "USD" ? "$" : "₹"}
        </Button>
        <Button variant="ghost">Export ↓</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KPI label="JOBS ANALYZED" value={String(kpis.total)} sub={batchLabel} />
        <KPI label="AVG FIT" value={kpis.total ? `${kpis.avgFit}%` : "—"} sub="across all jobs" tone="good" />
        <KPI label="HIGH FIT" value={String(kpis.highFit)} sub="≥ 85%" tone="accent" />
        <KPI
          label="MEDIAN COMP"
          value={kpis.medianComp ? fmtMoney(kpis.medianComp, currency) : "—"}
          sub="P50 of batch"
        />
        <KPI label="GAPS OPEN" value={String(jobs.reduce((a, j) => a + j.gaps.length, 0))} sub="skills to close" />
      </div>

      <Card className="overflow-hidden">
        <CardSectionHeader left="fit × compensation map" right={`N=${jobs.length} · LOG-FIT WEIGHTED`} />
        <FitSalaryPlot jobs={sortedForPlot} currency={currency} />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <JobLedger jobs={jobs} currency={currency} />
        <Card className="overflow-hidden">
          <CardSectionHeader left="skill heatmap" right="CAND vs REQ" />
          <SkillHeatmap jobs={jobs} />
        </Card>
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "good" | "accent";
}) {
  const color =
    tone === "good"
      ? "var(--color-sig-good)"
      : tone === "accent"
        ? "var(--color-accent)"
        : "var(--color-fg-0)";
  return (
    <div className="card p-3.5">
      <Label>{label}</Label>
      <div className="bignum mt-1.5 text-[28px]" style={{ color }}>
        {value}
      </div>
      <div className="text-fg-3 mt-1 text-[10px] tracking-[0.08em]">{sub}</div>
    </div>
  );
}
