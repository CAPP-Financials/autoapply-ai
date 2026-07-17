/**
 * Screen 01 — Resume (live).
 *
 * Renders the signed-in user's most recent parsed resume. The three states a
 * real user actually hits — no resume, uploaded-but-unparsed, parsed — are all
 * handled here; the fixture version only ever showed the third.
 */
import { requireSession } from "@/lib/auth/guard";
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Label, Divider } from "@/components/primitives/Label";
import { Spark } from "@/components/fit/Spark";
import { latestResume } from "@/lib/db/queries/resume";
import type { ResumeProfile } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const s = await requireSession();
  const resume = await latestResume(s.userId);
  const profile = (resume?.parsedJson as ResumeProfile | null) ?? null;

  const sizeKb = resume ? `${(resume.sizeBytes / 1024).toFixed(1)} KB` : undefined;

  return (
    <Shell
      active="resume"
      crumbs={["autoapply", "resume", resume ? `v${resume.version}` : "none"]}
      user={{ name: s.name.toUpperCase(), resumeMeta: resume ? `resume.v${resume.version} · ${sizeKb}` : undefined }}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UploadColumn resume={resume} />
        {profile ? <ProfilePreview profile={profile} /> : <NoProfile hasFile={Boolean(resume)} />}
      </div>
    </Shell>
  );
}

function UploadColumn({ resume }: { resume: Awaited<ReturnType<typeof latestResume>> }) {
  return (
    <div>
      <Label>Step 01 of 03</Label>
      <h1 className="mt-2 mb-1 text-3xl font-extrabold tracking-[-0.02em]">Upload your resume.</h1>
      <p className="text-fg-2 mt-0 max-w-[460px]">
        We&apos;ll parse it once into a structured profile. Every job you paste later is scored
        against this — no re-uploads.
      </p>

      <Card ticks className="relative mt-7 p-6">
        {resume ? (
          <div className="mb-3.5 flex items-center gap-3">
            <span className="border-accent text-accent grid h-7 w-7 place-items-center border text-sm">
              ↑
            </span>
            <div>
              <div className="font-semibold">{resume.blobUrl.split("/").pop() ?? "resume.pdf"}</div>
              <div className="text-fg-3 text-[11px]">
                {(resume.sizeBytes / 1024).toFixed(1)} KB · v{resume.version}
              </div>
            </div>
            <span
              className="ml-auto text-[10px] tracking-[0.12em]"
              style={{ color: resume.parsedAt ? "var(--color-sig-good)" : "var(--color-accent)" }}
            >
              {resume.parsedAt ? "● PARSED" : "● PARSING"}
            </span>
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="text-fg-2">Drop a PDF here, or choose a file.</div>
            <div className="text-fg-3 mt-1 text-[11px]">PDF · max 5 MB</div>
          </div>
        )}

        <div className="mt-5.5 flex gap-2.5">
          <Button variant="primary">{resume ? "Continue → Jobs" : "Choose file"}</Button>
          {resume && <Button variant="ghost">Re-parse</Button>}
          {resume && <Button variant="ghost">Replace file</Button>}
        </div>
      </Card>

      {resume?.parserLog && (
        <div className="text-fg-3 mt-4.5 text-[11px] leading-relaxed">
          <Label className="mb-1.5 block">Parser log</Label>
          <pre className="text-fg-3 m-0 font-mono text-[11px] whitespace-pre-wrap">
            {resume.parserLog}
          </pre>
        </div>
      )}
    </div>
  );
}

function NoProfile({ hasFile }: { hasFile: boolean }) {
  return (
    <Card className="self-start p-8 text-center">
      <Label>{hasFile ? "Parsing" : "No profile yet"}</Label>
      <p className="text-fg-2 mt-3 mb-0">
        {hasFile
          ? "Your resume is uploaded but hasn't finished parsing. Re-parse if this sticks."
          : "Upload a resume and the structured profile appears here."}
      </p>
    </Card>
  );
}

function ProfilePreview({ profile }: { profile: ResumeProfile }) {
  return (
    <Card className="self-start overflow-hidden">
      <header className="border-line text-fg-2 flex items-center justify-between border-b px-3.5 py-2.5 text-[11px] tracking-[0.16em] uppercase">
        <span>profile.json</span>
        <span className="text-fg-3">SCHEMA · MasterResume</span>
      </header>
      <div className="p-4.5 text-[12px] leading-relaxed">
        <div className="flex items-baseline gap-4">
          <div>
            <div className="text-[22px] font-extrabold tracking-[-0.01em]">{profile.name}</div>
            <div className="text-fg-2">
              {[profile.role, profile.location].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        </div>

        <Divider />

        <Label>summary</Label>
        <p className="text-fg-1 mt-1.5 mb-0">{profile.summary}</p>

        <Divider />

        <Label>skills · {profile.skills.length} extracted</Label>
        <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1">
          {profile.skills.map((s) => (
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
          {profile.experience.map((e, i) => (
            <div key={i} className="grid grid-cols-[20px_1fr_auto] gap-2.5 text-[12px]">
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
