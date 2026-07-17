"use client";

import Link from "next/link";

export type NavId = "resume" | "jobs" | "results" | "tracker" | "settings";

const NAV: { id: NavId; num: string; label: string; href: string }[] = [
  { id: "resume", num: "01", label: "Resume", href: "/resume" },
  { id: "jobs", num: "02", label: "Jobs", href: "/jobs" },
  { id: "results", num: "03", label: "Results", href: "/results" },
  { id: "tracker", num: "04", label: "Tracker", href: "/tracker" },
  { id: "settings", num: "05", label: "Settings", href: "/settings" },
];

type Props = {
  active: NavId;
  user?: { name: string; resumeMeta?: string };
  configuredProviders?: string[];
  defaultProvider?: string | null;
};

/**
 * The design's decorative "session 4f2a" tag. Must be derived, not random:
 * the previous version rendered "ssr0" on the server and Math.random() on the
 * client, which mismatched on every hydration.
 */
function sessionTag(seed?: string): string {
  let h = 0;
  for (const ch of seed ?? "anon") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h & 0xffff).toString(16).padStart(4, "0");
}

export function Sidebar({ active, user, configuredProviders = [], defaultProvider }: Props) {
  return (
    <aside className="bg-bg-1 border-line flex w-[200px] shrink-0 flex-col border-r">
      <div className="border-line border-b p-3.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="border-accent inline-grid h-[18px] w-[18px] place-items-center rounded-[2px] border">
            <span className="bg-accent block h-1.5 w-1.5" />
          </span>
          <span className="font-bold tracking-[0.04em]">
            autoapply<span className="text-accent">.ai</span>
          </span>
        </Link>
        <div className="text-fg-3 mt-2 text-[10px] tracking-[0.12em] uppercase">
          v0.1.0 · session <span className="text-fg-2">{sessionTag(user?.name)}</span>
        </div>
      </div>

      <nav className="flex-1 py-2" aria-label="Primary">
        {NAV.map((it) => {
          const isActive = active === it.id;
          return (
            <Link
              key={it.id}
              href={it.href}
              className={`flex items-center gap-2.5 border-l-2 px-3.5 py-2 text-xs ${
                isActive
                  ? "bg-bg-2 text-fg-0 border-accent"
                  : "text-fg-2 hover:bg-bg-2 hover:text-fg-1 border-transparent"
              }`}
            >
              <span
                className={`inline-block w-[18px] text-[10px] ${
                  isActive ? "text-accent" : "text-fg-3"
                }`}
              >
                {it.num}
              </span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      {configuredProviders.length > 0 && (
        <div className="border-line border-t p-3.5">
          <div className="label mb-2">LLM provider</div>
          {configuredProviders.map((p) => (
            <div
              key={p}
              className={`flex items-center justify-between py-1 text-xs ${
                p === defaultProvider ? "text-fg-0" : "text-fg-2"
              }`}
            >
              <span>{p}</span>
              {p === defaultProvider && (
                <span className="text-accent text-[10px]">● ACTIVE</span>
              )}
            </div>
          ))}
        </div>
      )}

      {user && (
        <div className="border-line text-fg-3 border-t p-3 text-[10px] tracking-[0.12em] uppercase">
          {user.name}
          {user.resumeMeta && <div className="text-fg-4">{user.resumeMeta}</div>}
        </div>
      )}
    </aside>
  );
}
