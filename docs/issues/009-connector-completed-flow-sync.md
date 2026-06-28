# Issue 009: Sync completed Hermes Flows from Connector to Hosted AIFlows

## Goal

Make the Connector upload completed shallow Hermes Flows to Hosted AIFlows.

## Product context

This is the core value: a user runs the Connector, completes Hermes work, and sees the Flow in Hosted AIFlows.

## Scope

- Poll Hermes every 5 seconds.
- Detect completed Flows for selected profiles.
- Ask whether to sync recent history; if yes default to recent 20, if no only new Flows.
- Generate shallow normalized Flow payloads.
- Push outbound HTTPS to ingestion API.
- Maintain cursor/retry state.

## Out of scope

- Live/running Flow Step streaming.
- Full raw tool output upload.
- Background service management.

## UX/design notes

CLI should clearly state whether it is syncing recent history or watching only new Flows.

## Implementation notes

Stable external IDs are required. Retries should not duplicate Flows. Local cursor state should survive process restart.

## Acceptance criteria

- [ ] Connector asks recent history choice.
- [ ] Connector polls every 5 seconds.
- [ ] Connector creates shallow Flow payloads from completed Hermes turns.
- [ ] Connector uploads selected profiles only.
- [ ] Connector retries failed uploads from local state.
- [ ] Duplicate uploads upsert rather than duplicate server records.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and ask Krzysztof to confirm the step is complete before relying on it.
