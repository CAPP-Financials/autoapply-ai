import { type ReactNode } from "react";

export function Chip({ dot, children }: { dot?: boolean; children: ReactNode }) {
  return (
    <span className="bg-bg-1 border-line text-fg-1 inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 text-[11px] tracking-[0.04em] uppercase">
      {dot && <span className="bg-accent inline-block h-1.5 w-1.5 rounded-full" />}
      {children}
    </span>
  );
}
