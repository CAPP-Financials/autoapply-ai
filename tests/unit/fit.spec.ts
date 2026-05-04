import { describe, expect, it } from "vitest";
import { fitColor, fitTone } from "@/lib/fit";

describe("fitTone()", () => {
  it("partitions cleanly at 85/70/50", () => {
    expect(fitTone(100)).toBe("good");
    expect(fitTone(85)).toBe("good");
    expect(fitTone(84)).toBe("ok");
    expect(fitTone(70)).toBe("ok");
    expect(fitTone(69)).toBe("mid");
    expect(fitTone(50)).toBe("mid");
    expect(fitTone(49)).toBe("bad");
    expect(fitTone(0)).toBe("bad");
  });
});

describe("fitColor()", () => {
  it("returns CSS var tokens (not raw colors)", () => {
    const c = fitColor(92);
    expect(c).toMatch(/var\(--color-sig-/);
  });

  it("changes when bucket changes", () => {
    expect(fitColor(92)).not.toBe(fitColor(75));
    expect(fitColor(75)).not.toBe(fitColor(60));
    expect(fitColor(60)).not.toBe(fitColor(40));
  });
});
