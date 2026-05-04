/**
 * Root loading boundary — shown while a route segment is suspending.
 * Matches the terminal aesthetic without being too noisy.
 */
export default function RootLoading() {
  return (
    <main className="bg-bg-0 flex min-h-screen items-center justify-center">
      <div className="text-fg-3 text-[11px] tracking-[0.16em] uppercase">
        loading <span className="caret" aria-hidden />
      </div>
    </main>
  );
}
