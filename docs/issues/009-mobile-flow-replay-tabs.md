# Issue 009: Make Flow Replay usable on mobile with Graph Timeline Details tabs

## Goal

Make Flow Replay usable on mobile by replacing the desktop graph/inspector split with tabs.

## Product context

AIFlows may be viewed on mobile, including through shared/self-hosted access later. The product should not be desktop-only.

## Scope

At mobile widths, Flow Replay should show:

```text
Prompt/header
[ Graph ] [ Timeline ] [ Details ]
```

The tabs should expose the same selected Flow data as desktop.

## Out of scope

- Perfect mobile graph editing/navigation.
- Separate mobile-only feature set.
- Native app behavior.

## UX/design notes

Graph remains one tab. Timeline and Details are separate tabs to avoid cramped side-by-side layouts.

Selection should still make sense: selecting a Step in Timeline should make Details show that Step. If selecting from Graph is difficult on mobile, preserve the best practical behavior.

## Implementation notes

Use CSS/responsive components rather than duplicating business logic. Shared selected Step state should work across desktop and mobile layouts.

## Acceptance criteria

- [ ] Desktop layout remains graph-left/inspector-right.
- [ ] Mobile layout shows Graph/Timeline/Details tabs.
- [ ] Mobile user can view graph, timeline, and selected Step details.
- [ ] Route/deep-link behavior works on mobile layout.
- [ ] No horizontal layout breakage at common phone widths.
- [ ] Component/state tests cover tabs where practical.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
