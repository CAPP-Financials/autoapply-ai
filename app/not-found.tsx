import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-bg-0 text-fg-0 flex min-h-screen items-center justify-center px-6">
      <div className="card max-w-lg p-8">
        <span className="label">404</span>
        <h1 className="mt-2 text-3xl font-extrabold">No route at that path.</h1>
        <p className="text-fg-2 mt-3 leading-relaxed">
          The page you tried to reach doesn&apos;t exist. The closest live screens:
        </p>
        <ul className="mt-4 flex flex-col gap-1.5 text-[12px]">
          <li>
            <Link href="/" className="text-accent hover:underline">
              /
            </Link>{" "}
            <span className="text-fg-3">— landing</span>
          </li>
          <li>
            <Link href="/resume" className="text-accent hover:underline">
              /resume
            </Link>{" "}
            <span className="text-fg-3">— upload &amp; profile</span>
          </li>
          <li>
            <Link href="/results" className="text-accent hover:underline">
              /results
            </Link>{" "}
            <span className="text-fg-3">— dashboard</span>
          </li>
        </ul>
      </div>
    </main>
  );
}
