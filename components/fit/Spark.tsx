/**
 * Tiny 12-bar histogram of a 0–100 value.
 */
export function Spark({ value }: { value: number }) {
  const bars = 12;
  const filled = Math.round((value / 100) * bars);
  return (
    <span className="spark">
      {Array.from({ length: bars }, (_, i) => (
        <i
          key={i}
          className={i < filled ? "on" : ""}
          style={{ height: 4 + (i % 4) * 2 }}
        />
      ))}
    </span>
  );
}
