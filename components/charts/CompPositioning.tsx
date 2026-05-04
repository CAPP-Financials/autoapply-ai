/**
 * Pure-CSS comp-range positioning bar — posted vs market p50 vs job range.
 * Inputs are percentages (0-100) representing positions on the bar.
 */
type Props = {
  rangeLeftPct: number;
  rangeRightPct: number;
  postedPct: number;
  marketPct: number;
  rangeLowLabel: string;
  rangeHighLabel: string;
  postedLabel: string;
  marketLabel: string;
};

export function CompPositioning(p: Props) {
  return (
    <div className="relative mt-3.5 h-[60px]">
      <div className="bg-bg-3 absolute top-7 right-0 left-0 h-0.5" />
      <div
        className="border-accent-line bg-accent-soft absolute top-[26px] h-1.5 border"
        style={{
          left: `${p.rangeLeftPct}%`,
          right: `${100 - p.rangeRightPct}%`,
          background: "var(--color-accent-soft)",
          borderColor: "var(--color-accent-line)",
        }}
      />
      <div
        className="bg-fg-2 absolute top-3.5 h-[30px] w-0.5"
        style={{ left: `${p.marketPct}%` }}
      />
      <div
        className="text-fg-3 absolute top-0 -translate-x-1/2 text-[9px] tracking-[0.1em] whitespace-nowrap"
        style={{ left: `${p.marketPct}%` }}
      >
        {p.marketLabel}
      </div>
      <div
        className="bg-accent absolute top-2 h-[42px] w-0.5"
        style={{ left: `${p.postedPct}%` }}
      />
      <div
        className="text-accent absolute top-[50px] -translate-x-1/2 text-[10px] tracking-[0.1em] whitespace-nowrap"
        style={{ left: `${p.postedPct}%` }}
      >
        {p.postedLabel}
      </div>
      <div className="text-fg-3 absolute top-9 text-[9px]" style={{ left: `${p.rangeLeftPct}%` }}>
        {p.rangeLowLabel}
      </div>
      <div className="text-fg-3 absolute top-9 text-[9px]" style={{ right: `${100 - p.rangeRightPct}%` }}>
        {p.rangeHighLabel}
      </div>
    </div>
  );
}
