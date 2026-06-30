# AGENTS.md — AIFlows Agent Instructions

Read this before making changes in this repo.

## Current product direction

AIFlows is SaaS-first.

The active implementation is:

```text
apps/web              Next.js Hosted AIFlows app
packages/connector    Node/TypeScript Connector CLI
packages/flow-core    Shared Flow/Step model
supabase/migrations   Supabase schema/RLS
```

The old local Express/Vite app was removed from active source. Do not resurrect it or recreate `packages/backend` / `packages/frontend` unless explicitly requested.

## Required reading order

Before implementing product changes, read:

1. `CONTEXT.md`
2. `docs/PRD.md`
3. `docs/architecture.md`
4. `docs/setup.md`
5. relevant `docs/adr/*.md`
6. relevant `docs/issues/*.md`

## Work style

- Follow tracer bullets: each issue should produce a thin, working, verifiable slice.
- Prefer small, reviewable changes.
- Preserve the SaaS decisions in ADRs.
- Do not turn AIFlows into a raw debugging console.
- Do not upload raw Hermes DB rows or full raw tool outputs.
- Do not claim chain-of-thought visibility.
- Keep Connector read-only with respect to Hermes.

## External setup rule

Supabase, GitHub, and Vercel setup is performed externally in the browser.

If a change requires external setup:

1. Update `docs/setup.md` with exact steps.
2. Document the required external steps.
3. Require confirmation before relying on that setup.

Never fake provider setup. Never assume secrets or deployed URLs exist until confirmed.

## Verification

Before reporting success, run relevant checks. For broad changes run:

```bash
npm run typecheck
npm test
npm run build
```

Report exact commands and results.

## OpenCode

If OpenCode is available and useful for bounded coding/review tasks, use it deliberately:

```bash
opencode --version
opencode auth list
opencode run '<bounded task>'
```

Still inspect and verify OpenCode's changes yourself.

## Ignore generated noise

Do not inspect or edit generated/dependency outputs unless debugging build artifacts:

```text
node_modules/
dist/
.next/
coverage/
*.tsbuildinfo
supabase/.temp/
```
