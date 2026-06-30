# Issue 007: Implement Connector heartbeat and Integration statuses

## Goal

Make Hosted AIFlows aware of Connector connection health.

## Product context

Users need to know whether their Hermes Integration is pending, connected, syncing, offline, or error.

## Scope

- Add heartbeat endpoint authenticated by connector token.
- Connector sends heartbeat while foreground process runs.
- Integration status updates based on heartbeat/ingest activity.
- Web UI shows status.
- Mark offline if heartbeat is stale.

## Out of scope

- Realtime subscriptions.
- Full monitoring/alerting.
- Background services.

## UX/design notes

Status should be simple and understandable. During setup, web UI can poll every few seconds.

## Implementation notes

Use same connector token for heartbeat and ingestion. Server should return unauthorized/not found if Integration is deleted; Connector should exit clearly.

## Acceptance criteria

- [ ] Connector sends heartbeat.
- [ ] API validates connector token.
- [ ] Integration statuses include pending, connected, syncing, offline, error.
- [ ] UI polls and displays status.
- [ ] Stale heartbeat marks Integration offline.
- [ ] Deleted Integration causes Connector to exit with clear message.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and require confirmation the step is complete before relying on it.
