/**
 * Currency formatting for the dashboard.
 * Mode mirrors the design's currency toggle: $ / ₹ / both.
 *
 * INR conversion is a fixed display rate (no live FX) — the design notes that
 * the number is for orientation, not booking. Override per-locale if you ever
 * make this user-configurable.
 */
const INR_PER_USD = 83;

export type CurrencyMode = "USD" | "INR" | "BOTH";

export function fmtMoney(usd: number, mode: CurrencyMode): string {
  const inr = Math.round(usd * INR_PER_USD);
  if (mode === "USD") return `$${(usd / 1000).toFixed(0)}k`;
  if (mode === "INR") return `₹${(inr / 100_000).toFixed(1)}L`;
  return `$${(usd / 1000).toFixed(0)}k · ₹${(inr / 100_000).toFixed(1)}L`;
}
