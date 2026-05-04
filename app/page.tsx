/**
 * Root marketing landing.
 * Sign-in users may eventually be redirected here to /resume or /results,
 * but until auth lands the public landing renders for everyone.
 */
import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-bg-0 text-fg-0 relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div className="scangrid pointer-events-none absolute inset-0 opacity-30" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-10">
        <header className="flex items-center gap-3">
          <span className="border-accent inline-grid h-5 w-5 place-items-center rounded-[2px] border">
            <span className="bg-accent block h-1.5 w-1.5" />
          </span>
          <span className="tracking-[0.04em]">
            autoapply<span className="text-accent">.ai</span>
          </span>
          <span className="text-fg-3 ml-2 text-[10px] tracking-[0.16em] uppercase">
            v0.1.0 · greenfield build
          </span>
        </header>

        <section className="flex flex-col gap-6">
          <span className="label">step 00 · landing</span>
          <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight md:text-5xl">
            Bring your resume.
            <br />
            <span className="text-fg-2">Bring your own AI key.</span>
            <br />
            Get a job that fits.
          </h1>
          <p className="text-fg-2 max-w-xl text-[13px] leading-relaxed">
            Upload your resume once. Paste any number of job descriptions. AutoApply analyzes fit,
            gaps, and compensation in your terminal — then drafts cover letters, ATS-tuned resumes,
            and interview evaluations. Your keys, your providers, your data.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/demo"
            className="bg-accent text-bg-0 inline-flex items-center gap-2 rounded-[4px] border px-4 py-2 text-xs font-semibold tracking-[0.04em] uppercase transition hover:brightness-110"
          >
            Try the demo →
          </Link>
          <Link
            href="/sign-up"
            className="border-line text-fg-0 hover:border-fg-3 hover:bg-bg-2 inline-flex items-center gap-2 rounded-[4px] border bg-transparent px-4 py-2 text-xs tracking-[0.04em] uppercase transition"
          >
            Sign up · BYO key
          </Link>
          <Link
            href="/sign-in"
            className="text-fg-2 hover:text-fg-0 hover:bg-bg-1 inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-xs tracking-[0.04em] uppercase transition"
          >
            Sign in
          </Link>
        </div>

        <footer className="text-fg-3 mt-8 grid grid-cols-1 gap-6 border-t border-[var(--color-line-soft)] pt-6 text-[10px] tracking-[0.14em] uppercase md:grid-cols-3">
          <div>
            <div className="text-fg-1 mb-1">5 screens</div>
            resume · jobs · results · detail · tracker
          </div>
          <div>
            <div className="text-fg-1 mb-1">6 providers</div>
            anthropic · openai · google · groq · openrouter · ollama
          </div>
          <div>
            <div className="text-fg-1 mb-1">USD + INR</div>
            currency-aware compensation analysis
          </div>
        </footer>
      </div>
    </main>
  );
}
