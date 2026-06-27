# Issue 003: Create routed Mission Control home with adapter bubbles

## Goal

Replace the flat dashboard entry with a routed Mission Control home that presents AIFlows as an adapter-first product.

## Product context

The first screen should communicate: AIFlows watches agent systems. Hermes is the first working adapter; future adapters are visible but disabled.

## Scope

Create the `/` route as Mission Control home.

It should show:

- active Hermes adapter card/bubble loaded from backend adapter data;
- static disabled coming-soon cards for OpenCode, Claude Code, and Codex;
- navigation from Hermes card to `/adapters/hermes`.

## Out of scope

- Implementing coming-soon adapter pages.
- Backend support for coming-soon adapters.
- Settings page.
- Password protection.

## UX/design notes

Cards/bubbles should feel visual and productful without becoming gimmicky. Coming-soon cards should be dimmed/disabled and not pretend to work.

Mobile must be usable: adapter cards should stack or wrap cleanly.

## Implementation notes

Add routing if not already present. Use real routes rather than only component state.

Prefer keeping this as a vertical slice: user can open `/`, see adapters, and click Hermes to move to the next route.

## Acceptance criteria

- [ ] `/` renders Mission Control home.
- [ ] Hermes appears as active/available from backend adapter data.
- [ ] OpenCode, Claude Code, and Codex appear as disabled coming-soon cards.
- [ ] Clicking Hermes navigates to `/adapters/hermes`.
- [ ] Disabled cards do not navigate to fake pages.
- [ ] Layout works on desktop and mobile widths.
- [ ] A frontend test covers rendering/clicking Hermes where practical.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
