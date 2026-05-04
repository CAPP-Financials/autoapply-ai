"use client";

import { useEffect, useState } from "react";
import { Card, CardSectionHeader } from "@/components/primitives/Card";
import { Label, Divider } from "@/components/primitives/Label";
import { Caret } from "@/components/primitives/Caret";

type QueueItem = {
  co: string;
  role: string;
  state: "queued" | "running" | "done" | "failed";
  pct: number;
  fit: number | null;
};

type Props = {
  provider: string;
  initialQueue: QueueItem[];
};

/**
 * Decorative streaming console for the design preview. Phase 7 swaps the
 * fake setInterval for a real SSE reader against `/api/jobs/[id]/analyze`.
 */
export function AnalysisConsole({ provider, initialQueue }: Props) {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [progress, setProgress] = useState(64);

  useEffect(() => {
    const t = setInterval(
      () => setProgress((p) => (p >= 100 ? 0 : p + 1)),
      80,
    );
    return () => clearInterval(t);
  }, []);

  const totalDone = queue.filter((q) => q.state === "done").length;

  return (
    <Card className="self-start overflow-hidden">
      <CardSectionHeader left="analysis console" right={`${provider.toUpperCase()} · STREAMING`} />
      <div className="p-4.5">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-fg-3 text-[11px] tracking-[0.12em]">BATCH PROGRESS</div>
            <div className="mt-0.5 text-[28px] font-extrabold">
              {totalDone} / {queue.length}{" "}
              <span className="text-fg-3 text-sm font-normal">complete</span>
            </div>
          </div>
          <div className="text-fg-2 text-right text-[11px]">
            <div>~28s remaining</div>
            <div className="text-fg-3">cost est. — (BYOK)</div>
          </div>
        </div>

        <div className="progress mt-3">
          <i style={{ width: `${(totalDone / queue.length) * 100}%` }} />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {queue.map((q, i) => (
            <div
              key={`${q.co}-${i}`}
              className={`grid grid-cols-[20px_1fr_90px_60px] items-center gap-2.5 border p-2.5 text-[12px] ${
                q.state === "running"
                  ? "bg-bg-2 border-line-soft"
                  : "border-line-soft bg-transparent"
              }`}
            >
              <span className="text-fg-3">{`0${i + 1}`}</span>
              <div>
                <div className="text-fg-0">{q.co}</div>
                <div className="text-fg-3 text-[10px]">{q.role}</div>
              </div>
              <div className="bg-bg-3 h-1">
                <div
                  className="h-full"
                  style={{
                    width:
                      q.state === "running" ? `${progress}%` : `${q.pct}%`,
                    background:
                      q.state === "done"
                        ? "var(--color-sig-good)"
                        : q.state === "running"
                          ? "var(--color-accent)"
                          : "var(--color-fg-4)",
                  }}
                />
              </div>
              <div className="text-fg-2 text-right">
                {q.state === "done" && (
                  <span style={{ color: "var(--color-sig-good)" }}>{q.fit}%</span>
                )}
                {q.state === "running" && <span className="text-accent">● live</span>}
                {q.state === "queued" && <span className="text-fg-3">queued</span>}
              </div>
            </div>
          ))}
        </div>

        <Divider />
        <Label className="mb-1.5 block">llm trace · stripe</Label>
        <pre className="text-fg-2 m-0 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{`▸ extract requirements ............ ✓ 14 found
▸ map to candidate skills ......... ✓ 12/14 matched
▸ evaluate fit ratio .............. ▮▮▮▮▮▮▮▮▯▯ 64%
▸ identify gaps ................... in progress
▸ draft cover letter .............. queued
▸ generate ats-resume ............. queued
`}
          <Caret />
        </pre>
      </div>
    </Card>
  );
}
