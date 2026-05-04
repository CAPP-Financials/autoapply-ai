"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Input } from "@/components/primitives/Input";
import { Label } from "@/components/primitives/Label";
import type { ProviderId, ProviderInfo } from "@/lib/ai/provider";

type Configured = {
  provider: ProviderId;
  lastUsedAt: string | Date | null;
  keyHint: string | null;
};

export function ProvidersTab({ providers }: { providers: Record<ProviderId, ProviderInfo> }) {
  const [configured, setConfigured] = useState<Configured[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/providers")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((d) => setConfigured(d.providers ?? []))
      .catch(() => setConfigured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="overflow-hidden">
      <header className="border-line text-fg-2 flex items-center justify-between border-b px-3.5 py-2.5 text-[11px] tracking-[0.16em] uppercase">
        <span>providers</span>
        <span className="text-fg-3">{configured.length} / {Object.keys(providers).length} configured</span>
      </header>
      <div className="flex flex-col">
        {Object.values(providers).map((p) => {
          const cfg = configured.find((c) => c.provider === p.id);
          return (
            <ProviderRow
              key={p.id}
              info={p}
              configured={cfg}
              loading={loading}
              onChange={(next) => {
                if (!next) setConfigured(configured.filter((c) => c.provider !== p.id));
                else
                  setConfigured(
                    configured.some((c) => c.provider === p.id)
                      ? configured.map((c) => (c.provider === p.id ? next : c))
                      : [...configured, next],
                  );
              }}
            />
          );
        })}
      </div>
    </Card>
  );
}

function ProviderRow({
  info,
  configured,
  loading,
  onChange,
}: {
  info: ProviderInfo;
  configured: Configured | undefined;
  loading: boolean;
  onChange: (next: Configured | null) => void;
}) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/settings/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: info.id, apiKey: val }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
      const data = await r.json();
      onChange({ provider: info.id, lastUsedAt: null, keyHint: data.keyHint ?? null });
      setVal("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/settings/providers/${info.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
      onChange(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-line-soft flex flex-col gap-3 border-t p-4 first:border-t-0 md:flex-row md:items-center">
      <div className="md:w-1/3">
        <div className="text-fg-0 font-semibold">{info.label}</div>
        <div className="text-fg-3 mt-1 text-[11px] tracking-[0.04em]">
          {info.freeTierHint ?? ""}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-3">
        {configured ? (
          <div className="text-fg-2 flex flex-1 items-center gap-3 text-[12px]">
            <span style={{ color: "var(--color-sig-good)" }}>● configured</span>
            <span className="text-fg-3">key: ····{configured.keyHint ?? "----"}</span>
            {configured.lastUsedAt && (
              <span className="text-fg-3 text-[10px]">
                last used {new Date(configured.lastUsedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        ) : (
          <>
            <Label className="md:hidden">api key</Label>
            <Input
              type="password"
              autoComplete="off"
              placeholder={loading ? "Loading…" : `your ${info.label} key`}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              disabled={loading || busy}
              className="flex-1 font-mono text-[12px]"
            />
          </>
        )}
        <div className="flex gap-2">
          {configured ? (
            <Button variant="ghost" disabled={busy} onClick={remove}>
              {busy ? "Removing…" : "Remove"}
            </Button>
          ) : (
            <Button variant="primary" disabled={busy || !val} onClick={save}>
              {busy ? "Saving…" : "Save"}
            </Button>
          )}
        </div>
      </div>
      {err && (
        <div className="text-[11px]" style={{ color: "var(--color-sig-bad)" }}>
          {err}
        </div>
      )}
    </div>
  );
}
