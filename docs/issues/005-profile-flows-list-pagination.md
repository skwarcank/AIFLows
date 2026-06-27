# Issue 005: Create profile Recent Flows page with latest 20 and Load more

## Goal

Create the page that lists recent completed Flows for a selected Hermes profile.

## Product context

Before replaying a Flow, the user chooses a profile and then chooses from recent completed Flows. The list should stay simple and recognizable.

## Scope

Implement `/adapters/hermes/profiles/:profileId`.

The page should:

- load recent completed Flows for the selected profile;
- show latest 20 initially;
- support Load more;
- render Flow cards with prompt preview, model, and timestamp;
- navigate to Flow Replay when a Flow is clicked;
- show simple empty state when no Flows exist.

## Out of scope

- Search/filter.
- Error badges in the list.
- Final answer previews.
- Tool counts/duration metrics on cards.
- Live/running Flows.

## UX/design notes

Flow cards should be compact and readable. The profile context should be clear from the page header or breadcrumb.

Empty state copy should be simple, e.g. `No Flows yet. Send a prompt to Hermes, then refresh.`

## Implementation notes

Use adapter-shaped API pagination. Offset pagination is acceptable for this local use case unless a simpler robust approach emerges.

Existing polling can remain if it does not complicate the route; do not add live status semantics.

## Acceptance criteria

- [ ] Route loads Flows for the selected profile.
- [ ] Initial request shows at most 20 Flows.
- [ ] Load more fetches/appends older Flows.
- [ ] Each card shows prompt preview, model, and timestamp.
- [ ] Clicking a Flow navigates to `/adapters/hermes/profiles/:profileId/flows/:flowId`.
- [ ] No search/filter UI is introduced.
- [ ] Empty state is simple.
- [ ] Tests cover pagination behavior at API or UI level where practical.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
