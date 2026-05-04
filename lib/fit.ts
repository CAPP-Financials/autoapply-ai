/**
 * Fit-score color mapping shared across charts/tables.
 * Maps a 0–100 score to a CSS color token.
 */
export function fitColor(value: number): string {
  if (value >= 85) return "var(--color-sig-good)";
  if (value >= 70) return "var(--color-sig-ok)";
  if (value >= 50) return "var(--color-sig-mid)";
  return "var(--color-sig-bad)";
}

export type FitTone = "good" | "ok" | "mid" | "bad";

export function fitTone(value: number): FitTone {
  if (value >= 85) return "good";
  if (value >= 70) return "ok";
  if (value >= 50) return "mid";
  return "bad";
}
