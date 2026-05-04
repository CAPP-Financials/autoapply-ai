/**
 * Screen 01 — Resume.
 * Static parsed-profile preview, parser log, action buttons.
 * Real upload + parse hook wires in Phase 6.
 */
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Label, Divider } from "@/components/primitives/Label";
import { Spark } from "@/components/fit/Spark";
import { MOCK_PROFILE } from "@/lib/data/mock";

export default function ResumePage() {
  return (
    <Shell
      active="resume"
      crumbs={["autoapply", "resume", "v3 — john_smith.pdf"]}
      user={{ name: "JOHN SMITH", resumeMeta: "resume.v3 · 2 KB" }}
      configuredProviders={["claude-3.5", "gemini-2.0", "gpt-4o", "llm council"]}
      defaultProvider="claude-3.5"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ResumeUploadColumn />
        <ProfilePreviewColumn />
      </div>
    </Shell>
  );
}

function ResumeUploadColumn() {
  return (
    <div>
      <Label>Step 01 of 03</Label>
      <h1 className="mt-2 mb-1 text-3xl font-extrabold tracking-[-0.02em]">Upload your resume.</h1>
      <p className="text-fg-2 mt-0 max-w-[460px]">
        We&apos;ll parse it once into a structured profile. Every job you paste later is scored
        against this — no re-uploads.
      </p>

      <Card ticks className="relative mt-7 p-6">
        <div className="mb-3.5 flex items-center gap-3">
          <span className="border-accent text-accent grid h-7 w-7 place-items-center border text-sm">
            ↑
          </span>
          <div>
            <div className="font-semibold">john_smith_resume_v3.pdf</div>
            <div className="text-fg-3 text-[11px]">2.4 KB · uploaded 12:04:33</div>
          </div>
          <span className="ml-auto text-[10px] tracking-[0.12em]" style={{ color: "var(--color-sig-good)" }}>
            ● PARSED
          </span>
        </div>

        <div className="mt-4.5 grid grid-cols-3 gap-2">
          {[
            { k: "experience", v: "5y 3mo" },
            { k: "roles", v: "3" },
            { k: "skills extracted", v: "21" },
            { k: "certifications", v: "3" },
            { k: "education", v: "1" },
            { k: "confidence", v: "98%" },
          ].map((s) => (
            <div key={s.k} className="border-line border-t pt-2">
              <div className="text-fg-3 text-[9px] tracking-[0.16em] uppercase">{s.k}</div>
              <div className="mt-0.5 text-base font-bold">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-5.5 flex gap-2.5">
          <Button variant="primary">Continue → Jobs</Button>
          <Button variant="ghost">Re-parse</Button>
          <Button variant="ghost">Replace file</Button>
        </div>
      </Card>

      <div className="text-fg-3 mt-4.5 text-[11px] leading-relaxed">
        <Label className="mb-1.5 block">Parser log</Label>
        <pre className="text-fg-3 m-0 font-mono text-[11px] whitespace-pre-wrap">{`[12:04:33] read pdf → 1 page, 2477 chars
[12:04:33] section detect → summary, skills, experience, education, projects, certifications
[12:04:34] llm extract (claude-3.5) → 21 skills, 3 roles, 1 degree
[12:04:34] confidence ${"█".repeat(20)} 98%
[12:04:34] indexed → ready for fit scoring`}</pre>
      </div>
    </div>
  );
}

function ProfilePreviewColumn() {
  return (
    <Card className="self-start overflow-hidden">
      <header className="border-line text-fg-2 flex items-center justify-between border-b px-3.5 py-2.5 text-[11px] tracking-[0.16em] uppercase">
        <span>profile.json</span>
        <span className="text-fg-3">SCHEMA · MasterResume</span>
      </header>
      <div className="p-4.5 text-[12px] leading-relaxed">
        <div className="flex items-baseline gap-4">
          <div>
            <div className="text-[22px] font-extrabold tracking-[-0.01em]">{MOCK_PROFILE.name}</div>
            <div className="text-fg-2">
              {MOCK_PROFILE.role} · {MOCK_PROFILE.location}
            </div>
          </div>
          <div className="text-fg-3 ml-auto text-[10px]">
            {MOCK_PROFILE.email}
            <br />
            {MOCK_PROFILE.links.join(" · ")}
          </div>
        </div>

        <Divider />

        <Label>summary</Label>
        <p className="text-fg-1 mt-1.5 mb-0">{MOCK_PROFILE.summary}</p>

        <Divider />

        <Label>skills · 21 extracted</Label>
        <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1">
          {MOCK_PROFILE.skills.map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-[11px]">
              <Spark value={s.level} />
              <span className="text-fg-1 flex-1">{s.name}</span>
              <span className="text-fg-3">{s.level}</span>
            </div>
          ))}
        </div>

        <Divider />

        <Label>experience</Label>
        <div className="mt-2 flex flex-col gap-2.5">
          {MOCK_PROFILE.experience.map((e, i) => (
            <div
              key={i}
              className="grid grid-cols-[20px_1fr_auto] gap-2.5 text-[12px]"
            >
              <span className="text-fg-3">{`0${i + 1}`}</span>
              <div>
                <div className="font-semibold">{e.role}</div>
                <div className="text-fg-2">{e.company}</div>
              </div>
              <span className="text-fg-3">{e.dates}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
