import { fitColor } from "@/lib/fit";

type Props = { value: number; size?: number; delta?: number };

export function FitNumber({ value, size = 64, delta = 0 }: Props) {
  const color = fitColor(value);
  return (
    <span style={{ color }} className="inline-flex items-baseline gap-1">
      <span className="bignum" style={{ fontSize: size }}>
        {value}
      </span>
      <span className="text-fg-3 font-medium" style={{ fontSize: size * 0.28 }}>
        %
      </span>
      {delta !== 0 && (
        <span
          className="ml-1.5 text-[11px] tracking-[0.04em]"
          style={{
            color: delta > 0 ? "var(--color-sig-good)" : "var(--color-sig-bad)",
          }}
        >
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
        </span>
      )}
    </span>
  );
}
