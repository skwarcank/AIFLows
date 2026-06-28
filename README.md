# AIFlows — Hosted Mission Control for AI Agent Flows

AIFlows is a hosted **Mission Control** app for watching AI agents work.

The current product direction is SaaS-first:

```text
Hosted AIFlows web app
        ↑ outbound HTTPS sync
AIFlows Connector CLI
        ↑ read-only local access
Hermes state.db / profiles
```

Hermes is the first supported Integration. A user logs into Hosted AIFlows, creates a Hermes Integration, runs a one-command Connector near their Hermes installation, and views synced completed Flows remotely.

## Current status

The historical local Express/Vite prototype has been removed from the active repo. Git history remains the archive for that implementation.

Current active code:

```text
apps/web              Next.js SaaS app
packages/connector    Node/TypeScript Connector CLI
packages/flow-core    Shared Flow/Step types and validation
supabase/migrations   Supabase schema and RLS migrations
```

Current active docs:

```text
CONTEXT.md            Glossary and product vocabulary
docs/PRD.md           Current SaaS PRD
docs/setup.md         External Supabase/GitHub/Vercel setup checklist
docs/architecture.md  System architecture and code map
docs/dev-notes.md     Developer workflow
docs/adr/             Architectural decisions
docs/issues/          Tracer-bullet implementation issues
AGENTS.md             Instructions for AI coding agents
```

## Product vocabulary

| Term | Meaning |
|---|---|
| **Workspace** | Internal container for a user's Integrations and Flows. UX is single-user for now. |
| **Integration** | User-facing connection to an agent system, initially Hermes. |
| **Connector** | Local CLI that runs near Hermes, reads Hermes read-only, and pushes normalized Flows to Hosted AIFlows. |
| **Flow** | One completed observable agent run. |
| **Step** | One observable event inside a Flow. |
| **Mission Control** | Hosted UI for connected Integrations and synced Flows. |

## Development quick start

Install dependencies:

```bash
npm install
```

Run the Next.js app:

```bash
npm run dev
```

Run the Connector during development:

```bash
npm run dev:connector -- connect --token <pairing-token> --api-base-url http://localhost:3000
npm run dev:connector -- run --once
```

Build and verify everything:

```bash
npm run typecheck
npm test
npm run build
```

## Environment setup

Start with examples:

```text
.env.example
apps/web/.env.local.example
packages/connector/.env.example
supabase/.env.local.example
```

Then follow:

```text
docs/setup.md
```

Krzysztof handles Supabase, GitHub, and Vercel setup externally in the browser. Agents should update `docs/setup.md` with exact steps and ask Krzysztof to confirm external setup before relying on it.

## Deployment model

- Supabase provides Auth and Postgres.
- Vercel Git integration handles deployment.
- GitHub Actions run quality gates only.
- Supabase migrations are manual first; CI should not auto-apply production migrations.

## Privacy and safety boundaries

- Connector reads Hermes storage read-only.
- Connector sends normalized shallow Flow/Step payloads, not raw Hermes database rows.
- Hosted AIFlows stores full user prompts and final assistant answers.
- Tool Steps store shallow descriptions/metadata, not full raw tool outputs.
- Retention target: latest 100 Flows per Integration.
- UI/docs must not claim to show chain-of-thought.

## Historical note

AIFlows began as a local Express/Vite prototype that read Hermes `state.db` directly and visualized completed traces. That code and old local planning docs were removed after the SaaS direction became the active product. Use git history before the cleanup commit if you need implementation archaeology; do not resurrect the old local app unless Krzysztof explicitly asks.
