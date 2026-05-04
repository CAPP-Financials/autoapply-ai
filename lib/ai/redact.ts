/**
 * PII redaction layer — every prompt path runs through this before
 * leaving the server boundary. Defaults to redacting; turn off per-user
 * via `users.redact_pii=false`.
 */

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /\+?\d[\d\s().-]{6,}\d/g;
const URL_RE = /\bhttps?:\/\/\S+/gi;
const LINKEDIN_RE = /\b(?:linkedin\.com\/in\/[a-z0-9_-]+)\b/gi;

export type RedactResult = {
  text: string;
  replacements: Record<string, number>;
};

/**
 * Redact PII patterns. Returns the redacted text and the count of each
 * replacement category for telemetry.
 */
export function redact(text: string): RedactResult {
  const replacements: Record<string, number> = {};
  let out = text;

  out = out.replace(EMAIL_RE, () => {
    replacements.email = (replacements.email ?? 0) + 1;
    return "[REDACTED_EMAIL]";
  });
  out = out.replace(LINKEDIN_RE, () => {
    replacements.linkedin = (replacements.linkedin ?? 0) + 1;
    return "[REDACTED_LINKEDIN]";
  });
  out = out.replace(URL_RE, () => {
    replacements.url = (replacements.url ?? 0) + 1;
    return "[REDACTED_URL]";
  });
  out = out.replace(PHONE_RE, () => {
    replacements.phone = (replacements.phone ?? 0) + 1;
    return "[REDACTED_PHONE]";
  });

  return { text: out, replacements };
}
