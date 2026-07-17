"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardSectionHeader } from "@/components/primitives/Card";
import type { CurrencyMode } from "@/lib/currency";
import { fmtMoney } from "@/lib/currency";
import { fitColor } from "@/lib/fit";
import type { JobView } from "@/lib/data/view";

type Sort = "fit" | "salary" | "delta";

export function JobLedger({ jobs, currency }: { jobs: JobView[]; currency: CurrencyMode }) {
  const [sortBy, setSortBy] = useState<Sort>("fit");

  const sorted = useMemo(() => {
    const s = [...jobs];
    if (sortBy === "fit") s.sort((a, b) => b.fitScore - a.fitScore);
    else if (sortBy === "salary") s.sort((a, b) => b.salaryUSD - a.salaryUSD);
    else s.sort((a, b) => b.fitDelta - a.fitDelta);
    return s;
  }, [jobs, sortBy]);

  const sortClass = (k: Sort) =>
    `cursor-pointer ${sortBy === k ? "text-accent" : "text-fg-3"}`;

  return (
    <Card className="overflow-hidden">
      <CardSectionHeader
        left="job ledger"
        right={
          <span className="flex gap-3.5">
            <span className={sortClass("fit")} onClick={() => setSortBy("fit")}>SORT FIT</span>
            <span className={sortClass("salary")} onClick={() => setSortBy("salary")}>SORT $</span>
            <span className={sortClass("delta")} onClick={() => setSortBy("delta")}>SORT Δ</span>
          </span>
        }
      />
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="text-fg-3 text-[10px] tracking-[0.14em] uppercase">
            <Th>#</Th>
            <Th align="left">company / role</Th>
            <Th>fit</Th>
            <Th>Δ</Th>
            <Th>comp</Th>
            <Th>status</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((j, i) => (
            <tr key={j.id} className="border-line-soft hover:bg-bg-2 border-t">
              <Td>
                <span className="text-fg-3">{String(i + 1).padStart(2, "0")}</span>
              </Td>
              <Td align="left">
                <Link href={`/jobs/${j.id}`} className="block">
                  <div className="font-semibold">{j.company}</div>
                  <div className="text-fg-3 text-[10px]">
                    {j.jobTitle} · {j.location}
                  </div>
                </Link>
              </Td>
              <Td>
                <span style={{ color: fitColor(j.fitScore) }} className="text-sm font-bold">
                  {j.fitScore}
                </span>
              </Td>
              <Td>
                <span
                  className="text-[11px]"
                  style={{
                    color:
                      j.fitDelta > 0
                        ? "var(--color-sig-good)"
                        : j.fitDelta < 0
                          ? "var(--color-sig-bad)"
                          : "var(--color-fg-3)",
                  }}
                >
                  {j.fitDelta > 0 ? "▲" : j.fitDelta < 0 ? "▼" : "·"} {Math.abs(j.fitDelta) || ""}
                </span>
              </Td>
              <Td className="text-fg-1">{fmtMoney(j.salaryUSD, currency)}</Td>
              <Td>
                {j.appliedAt ? (
                  <span className="text-[10px] tracking-[0.1em]" style={{ color: "var(--color-sig-ok)" }}>
                    ● APPLIED
                  </span>
                ) : (
                  <span className="text-fg-3 text-[10px] tracking-[0.1em]">○ READY</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Th({ children, align = "right" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className="px-3 py-2.5 font-medium"
      style={{ textAlign: align }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "right",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`p-3 align-middle ${className}`}
      style={{ textAlign: align }}
    >
      {children}
    </td>
  );
}
