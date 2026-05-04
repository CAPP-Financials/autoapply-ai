/**
 * Screen 03 — Results dashboard.
 * KPIs · fit×comp plot · job ledger (sortable, currency-aware) · skill heatmap.
 */
"use client";

import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardSectionHeader } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Label } from "@/components/primitives/Label";
import { FitSalaryPlot } from "@/components/charts/FitSalaryPlot";
import { SkillHeatmap } from "@/components/charts/SkillHeatmap";
import { JobLedger } from "@/components/job/JobLedger";
import { fmtMoney, type CurrencyMode } from "@/lib/currency";
import { MOCK_JOBS } from "@/lib/data/mock";

export default function ResultsPage() {
  const [currency, setCurrency] = useState<CurrencyMode>("BOTH");
  const cycleCurrency = () =>
    setCurrency((c) => (c === "BOTH" ? "USD" : c === "USD" ? "INR" : "BOTH"));

  const sortedForPlot = [...MOCK_JOBS].sort((a, b) => b.fitScore - a.fitScore);

  return (
    <Shell
      active="results"
      crumbs={["autoapply", "results", "batch · 6 jobs · 2026-05-02"]}
      user={{ name: "JOHN SMITH", resumeMeta: "resume.v3 · 2 KB" }}
      configuredProviders={["claude-3.5", "gemini-2.0", "gpt-4o", "llm council"]}
      defaultProvider="claude-3.5"
      topRight={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={cycleCurrency}>
            {currency === "BOTH" ? "$ · ₹" : currency === "USD" ? "$" : "₹"}
          </Button>
          <Button variant="ghost">Export ↓</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <KPI label="JOBS ANALYZED" value="6" sub="batch 9f3a" />
          <KPI label="AVG FIT" value="81%" sub="▲ 4 vs last batch" tone="good" />
          <KPI label="HIGH FIT" value="2" sub="≥ 85%" tone="accent" />
          <KPI label="MEDIAN COMP" value={fmtMoney(195_000, currency)} sub="P50 of batch" />
          <KPI label="GAP TIME" value="6.2w" sub="weeks to close top gap" />
        </div>

        <Card className="overflow-hidden">
          <CardSectionHeader left="fit × compensation map" right="N=6 · LOG-FIT WEIGHTED" />
          <FitSalaryPlot jobs={sortedForPlot} currency={currency} />
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
          <JobLedger jobs={MOCK_JOBS} currency={currency} />
          <Card className="overflow-hidden">
            <CardSectionHeader left="skill heatmap" right="CAND vs REQ" />
            <SkillHeatmap jobs={MOCK_JOBS} />
          </Card>
        </div>
      </div>
    </Shell>
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
