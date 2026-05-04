import { fmtMoney, type CurrencyMode } from "@/lib/currency";
import { fitColor } from "@/lib/fit";

type Job = {
  id: string;
  company: string;
  fitScore: number;
  salaryUSD: number;
};

const W = 980;
const H = 320;
const PAD = { l: 60, r: 24, t: 24, b: 36 };
const X_MIN = 0;
const X_MAX = 100;
const Y_MIN = 100_000;
const Y_MAX = 280_000;

const x = (v: number) => PAD.l + ((v - X_MIN) / (X_MAX - X_MIN)) * (W - PAD.l - PAD.r);
const y = (v: number) => H - PAD.b - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD.t - PAD.b);

const xt = [0, 25, 50, 75, 100];
const yt = [100, 140, 180, 220, 260];

/**
 * Fit % × $/yr scatter plot. Original viz from the design (replaces
 * recharts). Includes target/viable bands at >=85 and 70–85.
 */
export function FitSalaryPlot({
  jobs,
  currency,
}: {
  jobs: Job[];
  currency: CurrencyMode;
}) {
  return (
    <div className="px-5 pt-4 pb-5">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label="Fit × Compensation map">
        {/* zone bands */}
        <rect
          x={x(85)}
          y={PAD.t}
          width={W - PAD.r - x(85)}
          height={H - PAD.t - PAD.b}
          fill="var(--color-sig-good)"
          fillOpacity={0.04}
        />
        <rect
          x={x(70)}
          y={PAD.t}
          width={x(85) - x(70)}
          height={H - PAD.t - PAD.b}
          fill="var(--color-sig-ok)"
          fillOpacity={0.03}
        />

        {/* x-axis grid */}
        {xt.map((t) => (
          <g key={`x${t}`}>
            <line
              x1={x(t)}
              y1={PAD.t}
              x2={x(t)}
              y2={H - PAD.b}
              stroke="var(--color-line-soft)"
              strokeDasharray={t === 50 ? "0" : "2 4"}
            />
            <text x={x(t)} y={H - PAD.b + 16} className="axis-tick" textAnchor="middle">
              {t}
            </text>
          </g>
        ))}

        {/* y-axis grid */}
        {yt.map((t) => (
          <g key={`y${t}`}>
            <line
              x1={PAD.l}
              y1={y(t * 1000)}
              x2={W - PAD.r}
              y2={y(t * 1000)}
              stroke="var(--color-line-soft)"
              strokeDasharray="2 4"
            />
            <text x={PAD.l - 8} y={y(t * 1000) + 3} className="axis-tick" textAnchor="end">
              {t}k
            </text>
          </g>
        ))}

        <text x={PAD.l} y={PAD.t - 8} className="axis-tick">
          FIT %  →
        </text>
        <text x={PAD.l - 50} y={PAD.t - 8} className="axis-tick">
          $ K USD ↑
        </text>

        {/* zone labels */}
        <text x={x(92)} y={PAD.t + 14} className="axis-tick" fill="var(--color-sig-good)">
          ★ TARGET
        </text>
        <text x={x(77)} y={PAD.t + 14} className="axis-tick" fill="var(--color-sig-ok)">
          VIABLE
        </text>

        {/* points */}
        {jobs.map((j) => {
          const c = fitColor(j.fitScore);
          return (
            <g key={j.id}>
              <line
                x1={x(j.fitScore)}
                y1={y(j.salaryUSD) + 6}
                x2={x(j.fitScore)}
                y2={H - PAD.b}
                stroke="var(--color-accent)"
                strokeOpacity={0.18}
                strokeDasharray="2 2"
              />
              <circle cx={x(j.fitScore)} cy={y(j.salaryUSD)} r={6} fill={c} />
              <circle cx={x(j.fitScore)} cy={y(j.salaryUSD)} r={14} fill="none" stroke={c} strokeOpacity={0.3} />
              <text
                x={x(j.fitScore) + 12}
                y={y(j.salaryUSD) - 6}
                fill="var(--color-fg-0)"
                fontSize={11}
                fontFamily="var(--font-mono)"
                fontWeight={600}
              >
                {j.company}
              </text>
              <text
                x={x(j.fitScore) + 12}
                y={y(j.salaryUSD) + 8}
                fill="var(--color-fg-3)"
                fontSize={9}
                fontFamily="var(--font-mono)"
              >
                {fmtMoney(j.salaryUSD, currency)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
