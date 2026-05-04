import { fitColor } from "@/lib/fit";

type Props = { value: number; size?: number; label?: boolean };

/**
 * Donut-style fit indicator. Replaces recharts; pure SVG.
 */
export function FitRing({ value, size = 110, label = true }: Props) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const color = fitColor(value);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-bg-3)" strokeWidth={3} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="bignum" style={{ fontSize: size * 0.34, color }}>
          {value}
        </span>
        {label && <span className="text-fg-3 text-[9px] tracking-[0.16em]">FIT</span>}
      </div>
    </div>
  );
}
