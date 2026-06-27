# PRD: AIFlows SaaS — Hosted Mission Control with Hermes Integration

## Problem Statement

AIFlows currently exists as a local Hermes trace/Flow visualizer. That is useful for the developer running it beside Hermes, but it does not satisfy the new product direction: a user should be able to open a hosted AIFlows web app, log in, connect Hermes, and watch synced agent Flows remotely.

The desired experience is not self-hosting. It is SaaS:

1. User opens Hosted AIFlows in the browser.
2. User signs up/logs in.
3. User adds a Hermes Integration.
4. Hosted AIFlows gives a one-command connector command.
5. User runs the Connector near Hermes.
6. The Connector securely syncs completed Hermes Flows to Hosted AIFlows.
7. User views those Flows in a beautiful Mission Control UI.

The core challenge is that Hermes data lives locally on the user's machine/VPS. Hosted AIFlows cannot read it without a bridge. The bridge is the AIFlows Connector: a lightweight foreground Node/TypeScript CLI that runs near Hermes, reads Hermes storage read-only, normalizes completed Flows locally, and pushes shallow Flow payloads to Hosted AIFlows over outbound HTTPS.

## Solution

Build a new SaaS track for AIFlows using Next.js and Supabase, while keeping the existing local app as a temporary reference.

The first SaaS milestone is a full vertical slice:

> Login → Add Hermes Integration → Run Connector → Upload one completed Flow → View Flow Replay.

This is not a debugging-console product. Hosted AIFlows should focus on watching agents work through nice React Flow visualizations with shallow Step descriptions and metadata. It should not upload raw Hermes database rows, full raw tool outputs, private chain-of-thought, or deep forensic logs.

## User Stories

1. As a visitor, I want to sign up with email/password, so that I can create an AIFlows account.
2. As a developer user, I want to sign in with GitHub OAuth, so that login is convenient for my developer workflow.
3. As a signed-in user, I want AIFlows to create a default Workspace for me, so that future team support is possible without showing team complexity now.
4. As a signed-in user with no Integrations, I want guided onboarding, so that I know how to connect Hermes.
5. As a signed-in user, I want to add a Hermes Integration, so that Hosted AIFlows can receive my Hermes Flows.
6. As a signed-in user, I want AIFlows to show a one-command connector command, so that I know exactly what to run near Hermes.
7. As a signed-in user, I want the pairing page to explain that the command must run on the same machine/VPS as Hermes, so that I do not run it in the wrong place.
8. As a signed-in user, I want the web UI to poll connection status, so that it advances after the Connector pairs.
9. As a Connector user, I want the Connector to auto-detect Hermes paths, so that setup is easy.
10. As a Connector user, I want to override Hermes home with `--hermes-home`, so that unusual installs still work.
11. As a Connector user, I want to choose which Hermes profiles to sync, so that AIFlows does not upload everything by surprise.
12. As a Connector user, I want to choose whether to sync recent history, so that I control whether old Flows are uploaded.
13. As a Connector user, if I decline recent history sync, I want only new completed Flows to sync, so that I avoid uploading old data.
14. As a Connector user, I want the Connector to run in the foreground, so that v1 stays simple and transparent.
15. As a Connector user, I want the Connector to poll Hermes every 5 seconds, so that completed Flows appear remotely soon after they finish.
16. As a Connector user, I want the Connector to store local state under `~/.aiflows`, so that pairing/cursor state is preserved without modifying Hermes.
17. As a Connector user, I want the Connector to treat Hermes as read-only, so that AIFlows cannot damage or mutate Hermes data.
18. As a Connector user, I want network failures to retry from local cursor state, so that sync is not fragile.
19. As a Hosted AIFlows user, I want my Integration to show statuses such as pending, connected, syncing, offline, and error, so that I understand connection health.
20. As a Hosted AIFlows user, I want the Connector to send heartbeats, so that the UI can detect when it goes offline.
21. As a Hosted AIFlows user, I want to delete an Integration and its synced data, so that I control my data.
22. As a Hosted AIFlows user, I want deleted Integrations to revoke Connector access, so that a still-running Connector stops clearly.
23. As a Hosted AIFlows user, I want the latest 100 Flows retained per Integration, so that the product remains lightweight and privacy-conscious.
24. As a Hosted AIFlows user, I want Flow Replay to show full user prompt and final answer, so that the replay has context and outcome.
25. As a Hosted AIFlows user, I want tool Steps to use shallow descriptions and metadata, so that the Flow remains visual and safe rather than a raw log dump.
26. As a Hosted AIFlows user, I want graph/timeline/detail views, so that SaaS Flow Replay feels familiar to the local app but safer.
27. As a developer, I want Supabase RLS from the start, so that users cannot read each other's Workspaces, Integrations, or Flows.
28. As a developer, I want connector tokens stored hashed, so that a database leak does not reveal active Connector credentials.
29. As a developer, I want ingestion through Next.js API routes using the Supabase service role, so that Connector auth and writes are controlled server-side.
30. As a developer, I want stable external Flow IDs and upserts, so that retries do not create duplicate Flows.
31. As Krzysztof, I want Amon to prepare migrations and browser setup instructions, so that I can configure Supabase/GitHub/Vercel externally myself.
32. As Krzysztof, I want GitHub Actions quality gates, so that deployment via Vercel Git integration is automatic but guarded by typecheck/test/build.

## Implementation Decisions

### New SaaS app in the same repo

Create a new Next.js SaaS app inside this repo. Keep the current Express/Vite implementation as temporary reference during migration, but do not let two long-lived product shells rot side by side.

Expected monorepo direction:

```text
apps/web              # Next.js Hosted AIFlows app
packages/connector    # Node/TypeScript AIFlows Connector CLI
packages/flow-core    # shared Flow/Step types and shallow payload helpers
packages/hermes-adapter # Hermes local parser used by connector
supabase/migrations   # Supabase schema and RLS migrations
```

### Supabase Auth and database

Use Supabase for Auth and Postgres.

- Email/password is primary.
- GitHub OAuth is also supported.
- Supabase redirect URLs must use the deployed Hosted AIFlows URL in remote environments, not localhost.
- A default Workspace is created for each user.
- RLS is required from the start.

### Data model

Conceptual entities:

```text
User
Workspace
WorkspaceMember
Integration
IntegrationProfile
Flow
Step
PairingToken
ConnectorToken
```

First UX can assume one Hermes Integration per user, but the database should support multiple Integration rows later.

### Connector pairing

Web onboarding creates a pending Hermes Integration and short-lived one-time pairing token. The UI shows:

```bash
npx aiflows-connector connect --token <pairing-token>
```

The Connector exchanges the pairing token for a long-lived connector token, stored locally under `~/.aiflows/connector.json`. Connector tokens are stored hashed in the database and can be revoked by deleting the Integration.

### Connector runtime

The first Connector is a Node/TypeScript CLI run in the foreground. Service/background installation is later.

The Connector:

- auto-detects Hermes paths;
- supports `--hermes-home` override;
- asks which Hermes profiles to sync;
- asks whether to sync recent history;
- defaults recent history count to 20 when accepted;
- polls Hermes every 5 seconds;
- uploads completed Flows only;
- keeps local cursor/retry state;
- sends heartbeats;
- exits clearly if the Integration is deleted/revoked.

### Data uploaded

The Connector sends normalized Flow/Step payloads, not raw Hermes database rows.

Hosted AIFlows stores:

- full user prompt;
- full final assistant answer;
- shallow tool Step descriptions and metadata;
- not full raw tool outputs;
- not AI-generated summaries;
- latest 100 Flows per Integration.

### Ingestion

Connector pushes outbound HTTPS to Next.js API routes.

The API route validates the connector token, then writes with the Supabase service role. Browser users read data through Supabase client/RLS.

Connector uploads must include stable external IDs so retries can upsert rather than duplicate.

### UI

If no Integration exists, show guided onboarding. If an Integration exists, show Mission Control.

Onboarding only supports Hermes first. Do not distract with coming-soon adapters in onboarding.

Integration statuses:

```text
pending_pairing
connected
syncing
offline
error
```

The web UI polls Integration status during pairing.

### External setup workflow

Krzysztof will set up Supabase, GitHub, and Vercel externally in the browser. Amon must prepare repo files and explicit instructions.

Required repo artifacts:

- Supabase migrations;
- `.env.example`;
- one setup guide at `docs/saas/setup.md`;
- GitHub Actions quality gate workflow;
- Vercel Git integration instructions.

When an issue requires external setup, Amon should update setup instructions and ask Krzysztof to confirm the external step is complete before relying on it.

### CI/CD

Use Vercel Git integration for deployment. GitHub Actions should run quality gates only:

- install;
- typecheck;
- tests;
- build;
- migration validation if practical.

Supabase migrations are manual first. Do not auto-apply production migrations in CI.

## Testing Decisions

Testing should verify user-visible behavior and security seams.

Backend/API tests should cover:

- pairing token exchange;
- connector token validation;
- heartbeat authorization;
- Flow ingestion authorization;
- idempotent Flow upsert;
- retention limit behavior;
- Integration deletion/revocation behavior.

Database validation should cover:

- migration applies cleanly;
- RLS policies prevent cross-workspace reads/writes;
- required uniqueness constraints exist for external IDs.

Frontend tests should cover:

- unauthenticated/authenticated route behavior;
- no-Integration onboarding;
- pairing command display;
- Integration status polling UI;
- Mission Control after Integration exists;
- Flow Replay from shallow synced data.

Connector tests should cover:

- Hermes path detection;
- `--hermes-home` override;
- profile selection persistence;
- recent-history choice behavior;
- local state under `~/.aiflows`;
- stable external Flow IDs;
- retry/idempotency behavior.

## Out of Scope

This SaaS PRD does not include:

- background service installation for Connector;
- SSH-based remote Hermes reading;
- Hermes plugin/native integration;
- live running Flows or near-live Step streaming;
- raw Hermes DB upload;
- full raw tool output storage;
- AI-generated Step summaries;
- multiple adapter types beyond Hermes;
- team/workspace UI beyond default Workspace;
- billing;
- automated production Supabase migrations;
- Actions-driven Vercel deploys;
- current local app improvements.

## Success Criteria

This SaaS track succeeds when:

1. A user can sign up/log in through Hosted AIFlows.
2. The user gets a default Workspace.
3. The user can start adding a Hermes Integration.
4. Hosted AIFlows shows a pairing command.
5. The Node Connector can pair with that Integration.
6. The Connector can read Hermes read-only, with selected profiles.
7. The Connector can upload one completed shallow normalized Flow.
8. Hosted AIFlows stores the Flow under the correct Workspace/Integration/Profile.
9. Mission Control lists the synced Flow.
10. Flow Replay displays the shallow Flow as graph/timeline/details.
11. GitHub Actions can run quality gates.
12. Setup docs tell Krzysztof exactly what external browser steps to perform.
