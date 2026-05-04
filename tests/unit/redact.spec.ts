import { describe, expect, it } from "vitest";
import { redact } from "@/lib/ai/redact";

describe("redact()", () => {
  it("masks emails", () => {
    const r = redact("contact me at john.smith@example.com please");
    expect(r.text).toContain("[REDACTED_EMAIL]");
    expect(r.text).not.toContain("john.smith@example.com");
    expect(r.replacements.email).toBe(1);
  });

  it("masks LinkedIn handles", () => {
    const r = redact("see linkedin.com/in/jane-doe-123 for more");
    expect(r.text).toContain("[REDACTED_LINKEDIN]");
    expect(r.replacements.linkedin).toBe(1);
  });

  it("masks generic URLs", () => {
    const r = redact("portfolio: https://example.com/foo and http://bar.io");
    expect(r.replacements.url).toBe(2);
    expect(r.text).not.toContain("example.com/foo");
  });

  it("masks phone numbers", () => {
    const r = redact("call (555) 123-4567 anytime");
    expect(r.replacements.phone).toBe(1);
    expect(r.text).toContain("[REDACTED_PHONE]");
  });

  it("leaves plain prose alone", () => {
    const r = redact("Built React design systems for 12 product squads");
    expect(r.replacements).toEqual({});
    expect(r.text).toBe("Built React design systems for 12 product squads");
  });

  it("does not double-redact a partially redacted string", () => {
    // Re-running should produce the same output once everything is masked.
    const a = redact("a@b.com and c@d.com");
    const b = redact(a.text);
    expect(b.text).toBe(a.text);
  });
});
