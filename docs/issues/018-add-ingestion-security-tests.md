# Issue 018: Add focused ingestion and connector-security tests

## Goal

Strengthen confidence around the SaaS data/security seams: connector tokens, ingestion idempotency, retention, deletion/revocation, and workspace isolation assumptions.

## Product context

Hosted AIFlows accepts data from a local Connector and stores user-visible Flow Replay data. This is the most sensitive part of the app. The current test suite passes, but coverage should become more explicit around SaaS trust boundaries.

## Scope

Add or improve tests for:

- connector token validation;
- revoked/deleted Integration behavior;
- duplicate Flow upload/upsert behavior;
- retention rule: latest 100 Flows per Integration;
- rejected/invalid ingestion payloads;
- heartbeat status transitions where practical;
- cross-workspace data access assumptions in app-level helpers.

Tests may use fakes/mocks for Supabase where practical, but should model the important data and failure paths clearly.

## Out of scope

- Full browser E2E suite.
- Real production Supabase project tests unless setup already exists.
- Automated production migrations.
- Visual regression tests.

## Implementation notes

Prefer small tests close to the modules they protect:

```text
apps/web/tests/*
packages/connector/__tests__/*
packages/flow-core tests if validation changes
```

If a test exposes a real bug, fix it in the smallest safe way and document the behavior in the test name.

Good test names matter. Future agents should understand the intended security behavior from the test suite.

## Acceptance criteria

- [ ] Tests cover duplicate Flow ingestion without creating duplicates.
- [ ] Tests cover retention/deletion of older Flows beyond the latest 100, or document why the current helper cannot be tested without a deeper fake.
- [ ] Tests cover invalid/revoked connector token behavior.
- [ ] Tests cover deleted Integration/unauthorized connector behavior where practical.
- [ ] Existing tests remain green.
- [ ] No old local app packages are reintroduced.

## Verification commands

```bash
npm run typecheck
npm test
npm run build
```

Optional focused commands:

```bash
npm run test -w apps/web
npm run test -w packages/connector
npm run test -w packages/flow-core
```

## Blocked by

- Issue 017 is recommended first if UI/module refactors are in flight, but this can proceed independently if Amon focuses only on backend/helper tests.

## External setup rule

If this issue requires real Supabase project setup for integration tests, update `docs/setup.md`, tell Krzysztof exactly what to do, and ask him to confirm before relying on that setup. Prefer local mocks/fakes unless real external setup is deliberately chosen.
