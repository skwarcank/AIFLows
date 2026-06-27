# Issue 007: Add inspector timeline and synchronized Step selection

## Goal

Add the desktop right inspector with timeline and selected Step detail, synchronized with graph selection.

## Product context

The graph gives the visual shape; the inspector lets the user understand the selected Step without cluttering the graph.

## Scope

On desktop Flow Replay:

- show graph on the left;
- show inspector on the right;
- inspector contains timeline and selected Step detail together;
- clicking graph node selects timeline item and detail;
- clicking timeline item selects graph node and detail;
- switching Flow clears selection.

## Out of scope

- Modal/drawer Step detail.
- Timeline filters.
- Search inside timeline.
- Raw data view.

## UX/design notes

The inspector should feel like devtools/Mission Control: timeline for context, details for the selected Step.

Clicking empty graph canvas may clear selection if supported cleanly.

## Implementation notes

Prefer one clear owner for selected Step state so graph, timeline, and detail do not drift.

Existing `selectedEvent` state may need to move upward or into a hook/module.

## Acceptance criteria

- [ ] Inspector appears on the right on desktop.
- [ ] Timeline lists all Steps in order.
- [ ] Selected Step is highlighted in timeline.
- [ ] Clicking graph node updates timeline and detail.
- [ ] Clicking timeline Step updates graph and detail.
- [ ] Switching Flows clears selected Step.
- [ ] Tests cover selection synchronization where practical.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
