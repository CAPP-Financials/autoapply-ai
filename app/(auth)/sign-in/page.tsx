"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth/client";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Input } from "@/components/primitives/Input";
import { Label } from "@/components/primitives/Label";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"idle" | "sent" | "loading" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStage("loading");
    setErrMsg(null);
    try {
      const res = await signIn.magicLink({ email, callbackURL: "/resume" });
      if (res.error) throw new Error(res.error.message ?? "magic-link failed");
      setStage("sent");
    } catch (err) {
      setStage("error");
      setErrMsg(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <main className="bg-bg-0 flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-6">
        <Label>sign in</Label>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.01em]">Welcome back.</h1>
        <p className="text-fg-2 mt-2 text-[12px]">
          We&apos;ll email you a one-time link. No password.
        </p>

        {stage === "sent" ? (
          <div className="border-line-soft bg-bg-2 mt-5 border p-4 text-[12px]">
            <span style={{ color: "var(--color-sig-good)" }}>● link sent</span>
            <p className="text-fg-1 mt-2 leading-relaxed">
              Check your inbox at <span className="text-fg-0">{email}</span>. The link expires in
              15 minutes. In dev, the link is also printed to the server console.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <Label className="block">email</Label>
            <Input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {errMsg && <div className="text-[var(--color-sig-bad)] text-[11px]">{errMsg}</div>}
            <Button variant="primary" disabled={stage === "loading"} type="submit">
              {stage === "loading" ? "Sending…" : "Send magic link →"}
            </Button>
          </form>
        )}

        <hr className="border-line my-5 border-t" />
        <div className="text-fg-3 text-[11px]">
          New here?{" "}
          <Link href="/sign-up" className="text-fg-1 hover:text-accent">
            Create an account
          </Link>{" "}
          ·{" "}
          <button
            type="button"
            onClick={() => router.push("/resume")}
            className="text-fg-1 hover:text-accent underline-offset-2"
          >
            try the demo
          </button>
        </div>
      </Card>
    </main>
  );
}
