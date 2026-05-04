import { type HTMLAttributes, type ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  ticks?: boolean;
  children: ReactNode;
};

/**
 * The main container of the design — `.card` class is styled in globals.css
 * via [data-card-style="ledger|terminal"] on a parent element.
 */
export function Card({ ticks = false, className = "", children, ...rest }: Props) {
  return (
    <div {...rest} className={`card ${ticks ? "ticks relative" : ""} ${className}`}>
      {ticks && (
        <>
          <span className="tl" aria-hidden />
          <span className="tr" aria-hidden />
        </>
      )}
      {children}
    </div>
  );
}

export function CardSectionHeader({
  left,
  right,
}: {
  left: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="border-line text-fg-2 flex items-center justify-between border-b px-3.5 py-2.5 text-[11px] tracking-[0.16em] uppercase">
      <span>{left}</span>
      {right && <span className="text-fg-3">{right}</span>}
    </div>
  );
}
