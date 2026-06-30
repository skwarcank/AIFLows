# AIFlows

AIFlows is a hosted Mission Control app for watching completed AI agent runs.

The product pairs a hosted Next.js web app with a local Connector CLI. The Connector runs near an agent system, reads local state read-only, normalizes completed runs into shallow Flow/Step payloads, and syncs them to Hosted AIFlows over outbound HTTPS.

Hermes is the first supported integration.

## Repository structure

```text
apps/web              Next.js SaaS app
packages/connector    Node/TypeScript Connector CLI
packages/flow-core    Shared Flow/Step types and validation
supabase/migrations   Supabase schema and RLS migrations
```

Additional documentation:

```text
CONTEXT.md            Product vocabulary
AGENTS.md             AI coding-agent instructions
docs/PRD.md           Product requirements
docs/architecture.md  System architecture and code map
docs/setup.md         Supabase, GitHub, and Vercel setup
docs/dev-notes.md     Development workflow notes
docs/adr/             Architecture decision records
docs/issues/          Implementation issue specs
```

## Features

- Supabase Auth-based hosted app
- Workspace and Integration model
- Hermes Integration onboarding
- Connector pairing and heartbeat APIs
- Read-only local Connector for Hermes state
- Shallow Flow and Step ingestion
- Mission Control UI for synced Flows
- Flow Replay with graph, timeline, and details views
- Retention target of the latest 100 Flows per Integration

## Requirements

- Node.js 22+
- npm 10+
- Supabase project for hosted auth/database features

## Quick start

Install dependencies:

```bash
npm install
```

Create local environment files from examples:

```bash
cp apps/web/.env.local.example apps/web/.env.local
cp packages/connector/.env.example packages/connector/.env
cp supabase/.env.local.example supabase/.env.local
```

Fill the required values in `apps/web/.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Run the web app:

```bash
npm run dev:web
```

Open:

```text
http://localhost:3000
```

## Connector development

Run the Connector in development mode:

```bash
npm run dev:connector -- setup --token <pairing-token> --api-base-url http://localhost:3000
```

Run one sync pass:

```bash
npm run dev:connector -- run --once
```

## Verification

Run checks for the full workspace:

```bash
npm run typecheck
npm test
npm run build
```

Run only the web app checks:

```bash
npm run typecheck -w apps/web
npm test -w apps/web
```

## Supabase and deployment

Setup instructions live in `docs/setup.md`.

High-level deployment model:

- Supabase provides Auth and Postgres.
- Vercel Git integration deploys the Next.js app.
- GitHub Actions run quality gates.
- Supabase migrations are applied intentionally; CI does not auto-apply production migrations.

## Data and privacy boundaries

- The Connector reads Hermes storage read-only.
- The Connector sends normalized shallow Flow/Step payloads, not raw Hermes database rows.
- Hosted AIFlows stores full user prompts and final assistant answers.
- Tool Steps store shallow descriptions and metadata, not full raw tool outputs.
- The UI does not claim to show private chain-of-thought.

## Historical note

AIFlows previously had a local Express/Vite prototype that read Hermes `state.db` directly and visualized completed traces. The active implementation is now the hosted SaaS app plus Connector CLI; the old local prototype is only available through git history.
