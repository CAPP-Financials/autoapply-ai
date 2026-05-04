import { describe, expect, it } from "vitest";
import { fmtMoney } from "@/lib/currency";

describe("fmtMoney()", () => {
  it("formats USD shorthand", () => {
    expect(fmtMoney(235_000, "USD")).toBe("$235k");
  });

  it("formats INR in lakhs", () => {
    // 235k USD * 83 = 19,505,000 INR ≈ 195.0L
    expect(fmtMoney(235_000, "INR")).toBe("₹195.1L");
  });

  it("BOTH mode shows both", () => {
    const s = fmtMoney(235_000, "BOTH");
    expect(s).toContain("$235k");
    expect(s).toContain("₹");
  });
});
