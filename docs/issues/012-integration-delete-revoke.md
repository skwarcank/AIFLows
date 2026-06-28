# Issue 012: Implement Integration deletion, token revocation, and data deletion

## Goal

Give users control to delete a Hermes Integration and all synced data.

## Product context

Hosted AIFlows stores agent activity. Users need an obvious way to disconnect and remove data.

## Scope

- Add delete Integration action.
- Delete/cascade synced profiles, Flows, and Steps.
- Revoke connector credentials.
- Ensure running Connector exits clearly on next heartbeat/ingest.

## Out of scope

- Soft delete/recovery.
- Data export.
- Billing cancellation.

## UX/design notes

Deletion should be confirmed because it removes synced data immediately.

## Implementation notes

Immediate cascade deletion is v1 policy. Ensure RLS/app logic only lets users delete their own workspace Integration.

## Acceptance criteria

- [ ] User can delete own Integration.
- [ ] Synced profiles/Flows/Steps are removed.
- [ ] Connector token becomes invalid.
- [ ] Running Connector exits with clear message after revocation.
- [ ] Tests cover deletion and unauthorized access.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and ask Krzysztof to confirm the step is complete before relying on it.
