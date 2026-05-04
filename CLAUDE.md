@AGENTS.md

# AutoApply.AI — Project guidance for Claude

This is a production build of a resume × job-description AI analyzer. The full plan lives at [`~/.claude/plans/fetch-this-design-file-dapper-dijkstra.md`](../../../../.claude/plans/fetch-this-design-file-dapper-dijkstra.md). Read it before architectural changes.

## Hard constraints

- **Free-tier only.** No service that bills the project owner. Recurring AI cost is **always** the end user's via BYOK keys decrypted from `user_provider_keys`.
- **BYOK first.** Never call an AI provider with anything other than a key the requesting user supplied — except in `/demo`, which is 100% fixture replay.
- **Terminal/analyst dark aesthetic.** Tokens are in `app/globals.css` (`--color-bg-*`, `--color-fg-*`, `--color-accent`, signal palette). Use them; don't introduce new colors.
- **JetBrains Mono everywhere** (loaded via `next/font` as `--font-mono-loaded`).
- **PII never leaves the redacted layer** unless `users.redact_pii=false`. The `lib/ai/redact.ts` boundary is the gate.

## Conventions

- TypeScript strict; no `any` except in narrowly-scoped escape hatches.
- Server Components by default; client islands only for: dropzone, streaming console, sortable ledger, settings forms.
- Drizzle queries always include `where userId = ctx.userId`; the `lib/auth/guard.ts` helpers enforce a `UserId` branded type to make a missing filter a compile error.
- Streaming uses Vercel AI SDK v6 `streamText` / `streamObject` with SSE.
- Validate inputs with zod `.strict()` schemas at every API handler entry.
- Read tokens via `bg-bg-1 text-fg-2 border-line text-accent` Tailwind utilities (registered via `@theme` in `globals.css`).

## Don't

- Add a new dependency without checking it doesn't drag in a paid service.
- Use `process.env.X` directly. Always go through `lib/env.ts`.
- Render Markdown as `dangerouslySetInnerHTML`. Always go through `react-markdown` with the safe schema or render plain text.
- Touch `node_modules/`. Use `pnpm`.

## Reference

- Plan file: `~/.claude/plans/fetch-this-design-file-dapper-dijkstra.md`
- Original design bundle: `C:/Users/193pu/AppData/Local/Temp/design_extracted/autoapply-ai/`
