# Issue 011: Display synced Flows in Hosted Mission Control and Flow Replay

## Goal

Let a signed-in user view synced Flows in Hosted AIFlows.

## Product context

The first SaaS milestone completes only when the user can see an uploaded Flow in the web UI.

## Scope

- Show Mission Control when Integration exists.
- List Integration/profiles/Flows from Supabase with RLS.
- Open Flow Replay for a synced Flow.
- Render graph/timeline/detail using shallow Step payloads.

## Out of scope

- Deep debug details.
- Search/filter.
- Multiple adapter types.
- Live running Flows.

## UX/design notes

If no Integration exists, onboarding. If Integration exists but no Flows, show simple empty state. Flow Replay should remain beautiful and shallow.

## Implementation notes

Reuse UI ideas from the local app where helpful, but do not carry over local-only assumptions. Ensure RLS-limited browser reads work.

## Acceptance criteria

- [ ] User with Integration sees Mission Control.
- [ ] User can select profile/Flow.
- [ ] Flow Replay renders graph, timeline, and details.
- [ ] Shallow Step descriptions display cleanly.
- [ ] Full prompt/final answer display where stored.
- [ ] Tests cover rendering with mocked/supabase-seeded data where practical.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and ask Krzysztof to confirm the step is complete before relying on it.
