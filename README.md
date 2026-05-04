# AutoApply.AI

Resume × Job-Description AI analyzer. Upload a resume once. Paste any number of JDs. Get fit scores, gap analysis, tailored cover letters, ATS-optimized resumes, and interview evaluations — using your own AI provider keys (BYOK).

Built on Next.js 16 + Tailwind v4 + Drizzle (Postgres) + Better Auth + Vercel AI SDK v6. Deployed free on Vercel Hobby.

## Quick start

```bash
pnpm install
cp .env.example .env.local

# Generate two random 32-byte secrets:
openssl rand -base64 32   # BETTER_AUTH_SECRET
openssl rand -base64 32   # KEY_ENCRYPTION_KEY

pnpm db:push              # apply schema to DATABASE_URL
pnpm dev                  # http://localhost:3000
```

Visit `/demo` to see all screens against fixture data without signing up.

## What you need

| Service                 | Free tier                  | Required for                          |
| ----------------------- | -------------------------- | ------------------------------------- |
| Neon Postgres           | 0.5 GB / 191 cpu-hr        | DB                                    |
| Vercel Blob             | 1 GB                       | resume PDFs                           |
| Upstash Redis           | 10k cmd/day                | rate limits                           |
| Cloudflare Turnstile    | unlimited                  | bot defense                           |
| Sentry                  | 5k events/mo               | (optional) errors                     |
| Resend or SMTP          | 3k/mo on Resend            | magic-link emails                     |

End users supply their own AI keys (Gemini, Claude, OpenAI, Groq, OpenRouter, or Ollama) in **Settings → Providers**. Keys are encrypted at rest with `pgcrypto` keyed by `KEY_ENCRYPTION_KEY`.

## Stack

- **Framework**: Next.js 16 App Router + RSC + Turbopack
- **Styling**: Tailwind v4 (CSS-vars-as-theme), JetBrains Mono, terminal/analyst dark
- **Auth**: Better Auth (magic link + GitHub/Google OAuth)
- **DB**: Postgres + Drizzle ORM
- **AI**: Vercel AI SDK v6 with direct providers (no gateway markup)
- **Storage**: Vercel Blob
- **Bot defense**: Cloudflare Turnstile
- **Rate limit**: Upstash Redis
- **Tests**: Vitest (unit) + Playwright (e2e) + MSW (mocks)
- **CI**: GitHub Actions + CodeRabbit + Dependabot + gitleaks

## Scripts

| Command                | Use                                  |
| ---------------------- | ------------------------------------ |
| `pnpm dev`             | Dev server with Turbopack            |
| `pnpm build`           | Production build                     |
| `pnpm typecheck`       | `tsc --noEmit`                       |
| `pnpm lint`            | ESLint                               |
| `pnpm test`            | Vitest unit tests                    |
| `pnpm test:e2e`        | Playwright e2e                       |
| `pnpm db:push`         | Apply schema to DB                   |
| `pnpm db:generate`     | Generate migration SQL               |
| `pnpm db:migrate`      | Run migrations                       |
| `pnpm db:studio`       | Drizzle Studio                       |

## Layout

```
app/                    routes (App Router)
  (marketing)/          public landing
  (auth)/               sign-in/up
  (app)/                authenticated app shell
    resume/             Screen 01
    jobs/               Screen 02
    jobs/[id]/          Screen 04
    results/            Screen 03
    tracker/            applications kanban
    settings/           profile · providers · display · privacy
  api/                  route handlers
  demo/                 fixture-only public demo
components/             UI (terminal aesthetic)
lib/                    db · ai · auth · storage · utility
tests/                  unit + e2e
```

## Security model

- TLS-only · HSTS · strict CSP via middleware
- Better Auth sessions: HttpOnly + Secure + SameSite=Lax + rotating refresh
- Every protected route + query goes through a typed user-scope guard
- BYO API keys encrypted at rest with pgcrypto symmetric encryption
- PII (name/email/phone/links) split off the parsed-resume jsonb into dedicated bytea columns
- AI prompts pull from a redacted profile only (toggle in Settings)
- Rate limits: 60/min user, 200/min IP, 10 analyses/min user, 3 uploads/min user
- Cloudflare Turnstile on signup + first analyze
- Audit log on every mutation
- Dependabot + CodeQL + gitleaks in CI

## License

MIT — see [LICENSE](./LICENSE).
