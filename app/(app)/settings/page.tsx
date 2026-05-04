/**
 * Settings — Profile · Providers (BYO key) · Display · Privacy · Danger.
 * Phase 12 wiring: BYO-key form actually saves through /api/settings/providers.
 */
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/primitives/Card";
import { Label } from "@/components/primitives/Label";
import { ProvidersTab } from "@/components/settings/ProvidersTab";
import { PROVIDERS } from "@/lib/ai/provider";

export default function SettingsPage() {
  return (
    <Shell
      active="settings"
      crumbs={["autoapply", "settings", "providers"]}
      user={{ name: "JOHN SMITH", resumeMeta: "resume.v3 · 2 KB" }}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px_1fr]">
        <nav className="flex flex-col gap-1">
          {[
            { id: "providers", label: "Providers (BYO key)", active: true },
            { id: "profile", label: "Profile" },
            { id: "display", label: "Display" },
            { id: "privacy", label: "Privacy" },
            { id: "danger", label: "Danger zone" },
          ].map((t) => (
            <span
              key={t.id}
              className={`border-line-soft hover:bg-bg-2 hover:text-fg-0 cursor-pointer rounded-[2px] border px-3 py-2 text-[12px] ${
                t.active ? "text-accent border-accent" : "text-fg-2"
              }`}
            >
              {t.label}
            </span>
          ))}
        </nav>

        <div className="flex flex-col gap-5">
          <Card className="p-5">
            <Label>BYO API keys</Label>
            <p className="text-fg-2 mt-2 max-w-prose text-[12px] leading-relaxed">
              Paste a key for any provider you want to use. Keys are encrypted at rest with
              pgcrypto keyed by <code className="text-fg-0">KEY_ENCRYPTION_KEY</code>; they never
              appear in network responses or logs. Only the last 4 characters are shown back to you
              for identification.
            </p>
          </Card>
          <ProvidersTab providers={PROVIDERS} />
        </div>
      </div>
    </Shell>
  );
}
