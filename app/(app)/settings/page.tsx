/**
 * Settings — Phase 12 wires this to real persistence + the BYO-key vault.
 * For now it renders the layout so Sidebar's "Settings" link doesn't 404.
 */
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/primitives/Card";
import { Label } from "@/components/primitives/Label";

export default function SettingsPage() {
  return (
    <Shell
      active="settings"
      crumbs={["autoapply", "settings"]}
      user={{ name: "JOHN SMITH", resumeMeta: "resume.v3 · 2 KB" }}
      configuredProviders={["claude-3.5", "gemini-2.0", "gpt-4o", "llm council"]}
      defaultProvider="claude-3.5"
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px_1fr]">
        <nav className="flex flex-col gap-1">
          {[
            { id: "profile", label: "Profile" },
            { id: "providers", label: "Providers (BYO key)" },
            { id: "display", label: "Display" },
            { id: "privacy", label: "Privacy" },
            { id: "danger", label: "Danger zone" },
          ].map((t) => (
            <span
              key={t.id}
              className="border-line-soft text-fg-2 hover:bg-bg-2 hover:text-fg-0 cursor-pointer rounded-[2px] border px-3 py-2 text-[12px]"
            >
              {t.label}
            </span>
          ))}
        </nav>

        <Card className="p-5">
          <Label>Settings</Label>
          <p className="text-fg-2 mt-2 max-w-prose leading-relaxed">
            Profile, BYO API keys, display preferences (accent · card style · default fit
            visualization · currency), and privacy controls (PII redaction toggle, account deletion)
            all live here. Wired up in Phase 12.
          </p>
        </Card>
      </div>
    </Shell>
  );
}
