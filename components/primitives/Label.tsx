import { type ReactNode } from "react";

/**
 * Tiny uppercase label — section header, form label, KPI caption.
 */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`label ${className}`}>{children}</span>;
}

export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-line my-4 border-t ${className}`} />;
}
