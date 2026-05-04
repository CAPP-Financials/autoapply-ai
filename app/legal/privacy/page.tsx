export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
      <p className="text-fg-2 mt-4 leading-relaxed">
        Resumes and job descriptions are stored server-side, encrypted at rest. PII contact fields
        are split out and individually encrypted; the AI prompt path runs through a redaction layer
        unless you disable it in Settings → Privacy. Your supplied AI keys are encrypted with
        pgcrypto and never logged. Full policy drafted in Phase 17.
      </p>
    </main>
  );
}
