type Skill = { skill: string; cand: number; req: number };

/**
 * Hand-built SVG radar — candidate vs required levels for N skills.
 * Replaces recharts; pixel-matches the design.
 */
export function SkillRadar({ skills, size = 240 }: { skills: Skill[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 28;
  const n = skills.length;

  const angle = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const point = (i: number, val: number) => {
    const a = angle(i);
    const rr = (val / 100) * r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as const;
  };

  const buildPath = (k: "cand" | "req") =>
    skills
      .map((s, i) => point(i, s[k]))
      .map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`)
      .join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Skill radar">
      {/* concentric guides */}
      {[20, 40, 60, 80, 100].map((v) => (
        <polygon
          key={v}
          points={skills.map((_, i) => point(i, v).join(",")).join(" ")}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={1}
          strokeDasharray={v === 100 ? "0" : "2 3"}
        />
      ))}
      {/* axes */}
      {skills.map((_, i) => {
        const [x, y] = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-line)" strokeWidth={1} />;
      })}
      {/* required area */}
      <path
        d={buildPath("req")}
        fill="var(--color-fg-3)"
        fillOpacity={0.08}
        stroke="var(--color-fg-3)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      {/* candidate area */}
      <path d={buildPath("cand")} fill="var(--color-accent-soft)" stroke="var(--color-accent)" strokeWidth={1.5} />
      {/* labels */}
      {skills.map((s, i) => {
        const [x, y] = point(i, 118);
        const a = angle(i);
        const anchor = Math.cos(a) > 0.3 ? "start" : Math.cos(a) < -0.3 ? "end" : "middle";
        return (
          <text key={i} x={x} y={y} className="axis-tick" textAnchor={anchor} dominantBaseline="middle">
            {s.skill}
          </text>
        );
      })}
    </svg>
  );
}
