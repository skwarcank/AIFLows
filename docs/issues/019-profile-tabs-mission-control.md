# Issue 019: Add profile tabs to Mission Control Flow lists

## Goal

Let users switch between synced Hermes profiles in Hosted Mission Control so each Integration Profile has its own distinct Flow list and replay selection.

## Product context

AIFlows can sync multiple Hermes profiles for one Integration, but the current Mission Control UI flattens Flows from all profiles into one list. This makes profiles feel like metadata instead of a real navigation context.

For Hermes, an **Integration Profile** maps to a Hermes profile such as `default` or `asterion`. Mission Control should make that profile boundary visible and useful.

Relevant glossary entry: `CONTEXT.md` → `Integration Profile`.

## Scope

Build a small vertical UI/data slice:

- Display profile tabs near the Integration status/header, not only inside the Flow list card.
- Select the `default` profile on first load if it exists.
- If `default` does not exist, select the first available profile.
- Let the user switch between profile tabs.
- Filter the Flow list to only show Flows from the selected profile.
- When switching profile tabs, select the top/most recent Flow in that selected profile.
- Keep profiles visible even if they have no Flows.
- Show a clear empty state for a selected profile with no Flows.

## Out of scope

- URL/query-param state for selected profile.
- “All profiles” mixed feed tab.
- Flow counts on profile tabs.
- Connector profile selection changes.
- Database schema changes unless the current data shape makes this impossible.
- Visual redesign beyond the necessary tab UI.

## UX/design notes

Preferred layout:

```text
Hosted Flow Replay
Hermes integration: connected

Profiles:
[default] [asterion]

┌ Flow list for selected profile ┐ ┌ Replay selected Flow ┐
```

Tabs should be visually simple:

```text
[default] [asterion]
```

No counts for now.

Empty state example:

```text
No Flows synced for `asterion` yet.
Keep the connector running, sync recent history, or choose another profile.
```

The mental model should be:

```text
Profile tab controls the Flow list.
Flow list controls the replay panel.
```

## Implementation notes / likely seams

Likely area:

```text
apps/web/components/hermes-pairing-card.tsx
apps/web/lib/mission-control.ts
```

Current `MissionControlData` already appears to include profiles and flows. Prefer deriving grouped/profile-filtered flows in the client component unless the server data shape needs a small improvement.

If touching the large Mission Control component becomes awkward, do a small extraction only if it keeps this issue simple. Do not turn this into the broader UI module split from issue 017.

A profile's display name should come from the stored Integration Profile record. If both `external_id` and `display_name` exist, use the friendliest stable label already exposed by the data loader.

Sorting assumption:

- Flow list top item should be most recent.
- If existing Mission Control data already sorts by finished/created time, reuse that order.
- Do not invent complex sorting unless current order is wrong.

## Acceptance criteria

- [ ] Mission Control shows profile tabs near the Integration/header area when profiles exist.
- [ ] `default` profile is selected by default when present.
- [ ] If `default` is absent, the first available profile is selected.
- [ ] Switching tabs filters the Flow list to that profile only.
- [ ] Switching tabs selects the top/most recent Flow in the newly selected profile.
- [ ] Tabs do not show counts.
- [ ] Selected profile is not persisted in the URL.
- [ ] Profiles with zero Flows remain visible as tabs.
- [ ] Empty selected profiles show a useful empty state.
- [ ] Existing Integration deletion, status polling, and Flow Replay behavior still work.

## Verification commands

```bash
npm run typecheck
npm test
npm run build
```

## Manual verification

With a local/dev dataset or seeded/fake data containing at least two profiles:

1. Open Hosted Mission Control.
2. Confirm `default` is selected first if present.
3. Confirm only `default` Flows show in the Flow list.
4. Click another profile tab.
5. Confirm only that profile's Flows show.
6. Confirm the replay panel switches to the most recent Flow for that profile.
7. Test a profile with no Flows and confirm the empty state appears.

## Blocked by

None - can start immediately.

## External setup rule

If this issue requires external Supabase/Vercel/GitHub setup or seed data, update `docs/setup.md`, tell Krzysztof exactly what to do, and ask him to confirm before relying on that setup.
