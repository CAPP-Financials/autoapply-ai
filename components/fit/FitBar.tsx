import { fitColor } from "@/lib/fit";

type Props = { value: number; percentile?: number | null };

export function FitBar({ value, percentile = null }: Props) {
  const color = fitColor(value);
  return (
    <div className="flex min-w-[180px] flex-col gap-1">
      <div className="text-fg-3 flex justify-between text-[10px] tracking-[0.12em]">
        <span>FIT {value}%</span>
        {percentile != null && <span>P{percentile}</span>}
      </div>
      <div className="bg-bg-2 border-line-soft h-1.5 border">
        <div style={{ width: `${value}%`, height: "100%", background: color }} />
      </div>
      <div className="relative h-2">
        {[25, 50, 75].map((p) => (
          <div
            key={p}
            className="bg-fg-4 absolute top-0 h-1 w-px"
            style={{ left: `${p}%`, background: "var(--color-fg-4)" }}
          />
        ))}
      </div>
    </div>
  );
}
