# Issue 010: Implement Flow ingestion API, idempotency, and latest-100 retention

## Goal

Implement the Hosted AIFlows ingestion endpoint that stores Connector-uploaded Flows safely.

## Product context

The Connector sends completed shallow Flows. Hosted AIFlows must authorize, store, dedupe, and enforce retention.

## Scope

- Add ingestion endpoint authenticated by connector token.
- Validate payload shape.
- Upsert IntegrationProfile records.
- Upsert Flow by stable external ID.
- Store Steps under Flow.
- Enforce latest 100 Flows per Integration.

## Out of scope

- Raw payload archival.
- Live step streaming.
- User-facing search/filter.

## UX/design notes

Ingestion errors should be clear enough for Connector to print useful messages.

## Implementation notes

Use Supabase service role only inside server route. Connector tokens should be compared against hashed DB values. Ensure workspace/integration ownership is enforced server-side.

## Acceptance criteria

- [ ] Ingestion endpoint accepts valid Connector token.
- [ ] Invalid/revoked token is rejected.
- [ ] Flow uploads are idempotent.
- [ ] Profiles are stored as records under Integration.
- [ ] Steps are stored under Flow.
- [ ] Latest 100 Flow retention per Integration is enforced or explicitly implemented as a callable cleanup path.
- [ ] Tests cover duplicate upload and unauthorized upload.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/saas/setup.md` and ask Krzysztof to confirm the step is complete before relying on it.
