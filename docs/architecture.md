# AIFlows Architecture

AIFlows is a hosted SaaS product for watching completed AI agent Flows.

## System shape

```text
┌──────────────────────────┐
│ Hosted AIFlows / Next.js │
│ - Supabase Auth UI       │
│ - Mission Control        │
│ - Connector APIs         │
└─────────────▲────────────┘
              │ outbound HTTPS
              │ connector token
┌─────────────┴────────────┐
│ AIFlows Connector CLI    │
│ - pairs with Integration │
│ - reads Hermes read-only │
│ - normalizes Flows       │
│ - sends heartbeats       │
└─────────────▲────────────┘
              │ read-only SQLite
┌─────────────┴────────────┐
│ Hermes local state       │
│ ~/.hermes/state.db       │
│ ~/.hermes/profiles/*     │
└──────────────────────────┘
```

## Active modules

### `apps/web`

Next.js SaaS application.

Responsibilities:

- Supabase Auth login/callback flow.
- Authenticated app shell.
- Default Workspace initialization.
- Hermes Integration onboarding and pairing command generation.
- Connector pairing exchange endpoint.
- Connector heartbeat endpoint.
- Connector ingestion endpoint.
- Hosted Mission Control and Flow Replay UI.

Important seams:

- `lib/app-state.ts` — Workspace and first Integration loading/creation.
- `lib/hermes-pairing.ts` — user-created pending Hermes Integration and pairing command.
- `lib/pairing-exchange.ts` — Connector exchanges one-time pairing token for connector token.
- `lib/connector-auth.ts` — Connector bearer token validation.
- `lib/flow-ingestion.ts` — stores uploaded shallow Flows/Steps and retention cleanup.
- `lib/mission-control.ts` — loads Integration Profiles, Flows, and Steps for UI.

### `packages/connector`

Node/TypeScript CLI run near Hermes.

Responsibilities:

- Pair using guided `aiflows-connector setup --token <token>` or lower-level `aiflows-connector connect --token <token>`.
- Store local state under `~/.aiflows/connector.json`.
- Auto-detect Hermes home and profiles.
- Allow `--hermes-home` override.
- Show status/config/doctor diagnostics after setup.
- List detected profiles and locally add/remove selected profiles without deleting Hermes or hosted data.
- Ask which profiles to sync.
- Ask whether to sync recent history and support queued recent history per profile.
- Poll every 5 seconds.
- Upload completed shallow Flows.
- Send heartbeat.

The Connector must never write to Hermes files/databases.

### `packages/flow-core`

Shared Flow/Step types and validation.

Responsibilities:

- Define shallow Flow payload shape.
- Validate ingestion payloads.
- Normalize Step kinds.
- Provide small shared helpers like text truncation.

This package is the public seam between the Connector and Hosted AIFlows ingestion.

### `supabase/migrations`

Database schema and RLS policies.

Core model:

```text
Workspace
└── Integration
    └── IntegrationProfile
        └── Flow
            └── Step
```

Connector auth model:

```text
PairingToken  short-lived, one-time, hashed
ConnectorToken longer-lived, hashed, revocable
```

## Data policy

The hosted database stores shallow normalized data:

- full user prompt;
- full final assistant answer;
- Step title/kind/description/metadata;
- no raw Hermes database rows;
- no full raw tool output;
- no chain-of-thought.

Retention target: latest 100 Flows per Integration.

## Historical local prototype

The previous local Express/Vite implementation was deleted from active source after the SaaS app and Connector became the current direction. The useful concepts were retained:

- Flow / Step language;
- Hermes Profile concept;
- read-only Hermes access;
- observable-only replay;
- graph/timeline/detail UI shape.

Git history is the source for old implementation archaeology. Do not recreate local Express/Vite packages unless explicitly requested.
