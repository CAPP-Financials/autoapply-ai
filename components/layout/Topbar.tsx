"use client";

import { type ReactNode, useEffect, useState } from "react";

type Props = {
  crumbs: string[];
  right?: ReactNode;
};

/**
 * The topbar shows the current breadcrumb path, a live clock, and a
 * connected indicator. Right-side slot can host export / currency / etc.
 */
export function Topbar({ crumbs, right }: Props) {
  const [now, setNow] = useState<string>(() => formatNow());

  useEffect(() => {
    const t = setInterval(() => setNow(formatNow()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-bg-1 border-line text-fg-2 flex h-[44px] items-center gap-3.5 border-b px-4 text-[11px] tracking-[0.06em]">
      {crumbs.map((c, i) => (
        <span key={`${c}-${i}`} className="flex items-center gap-3.5">
          {i > 0 && <span className="text-fg-4">/</span>}
          <span className={i === crumbs.length - 1 ? "text-fg-0" : "text-fg-2"}>{c}</span>
        </span>
      ))}
      <span className="flex-1" />
      <span className="text-fg-3" suppressHydrationWarning>
        {now}
      </span>
      <span className="text-sig-good text-[var(--color-sig-good)]">● connected</span>
      {right}
    </div>
  );
}

function formatNow() {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace("T", " ") + " UTC";
}
