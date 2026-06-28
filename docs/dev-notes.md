# AIFlows Development Notes

## Current active direction

AIFlows is now SaaS-first. The active product is the hosted Next.js app plus the local Connector CLI.

Do not treat deleted local Express/Vite packages as current product surface. They were historical prototype code and are available only through git history.

## Repo layout

```text
apps/web/              Next.js Hosted AIFlows app
packages/connector/    Node/TypeScript Connector CLI
packages/flow-core/    Shared Flow/Step types and validators
supabase/migrations/   Supabase schema and RLS migrations
docs/                  PRD, setup guide, architecture, ADRs, issues
CONTEXT.md             Glossary
AGENTS.md              AI-agent instructions
```

## Commands

```bash
npm install
npm run dev          # Next.js web app
npm run dev:connector -- --help
npm run typecheck
npm test
npm run build
```

Root scripts intentionally cover only active packages:

- `packages/flow-core`
- `apps/web`
- `packages/connector`

## External setup workflow

Krzysztof configures Supabase, GitHub, and Vercel manually in the browser.

When implementation needs external setup:

1. Update `docs/setup.md` with exact steps.
2. Tell Krzysztof what to do.
3. Ask for confirmation before relying on the external resource.

Do not assume Supabase/Vercel/GitHub is configured until confirmed.

## Supabase

- Auth: email/password primary, GitHub OAuth also supported.
- Redirect URLs must include the deployed URL; production verification emails must not point to localhost.
- RLS is required from the start.
- Migrations are manual first.
- GitHub Actions should validate migrations if practical, but not apply production migrations.

## Connector

Connector command shape:

```bash
npx aiflows-connector connect --token <pairing-token>
```

Development example:

```bash
npm run dev:connector -- connect --token <pairing-token> --api-base-url http://localhost:3000
npm run dev:connector -- run --once
```

Connector state lives in:

```text
~/.aiflows/connector.json
```

The Connector reads Hermes read-only and pushes outbound HTTPS to Hosted AIFlows.

## Testing and verification

Use real command output before claiming success:

```bash
npm run typecheck
npm test
npm run build
```

Useful focused checks:

```bash
npm run test -w apps/web
npm run test -w packages/connector
npm run typecheck -w packages/flow-core
```

## Build artifacts and noise

Ignore generated/dependency directories when inspecting:

```text
node_modules/
dist/
.next/
coverage/
*.tsbuildinfo
supabase/.temp/
```

## Historical note

The old local app was useful as a prototype, but its docs and scripts became misleading once Hosted AIFlows became the product. Durable concepts were moved into `CONTEXT.md`, `docs/PRD.md`, and `docs/architecture.md`; old implementation details live in git history.
