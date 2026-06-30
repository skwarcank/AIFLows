# Issue 017: Split the Mission Control pairing component into deeper UI modules

## Goal

Refactor the current large Hermes pairing / Mission Control component into smaller, clearer components without changing product behavior.

## Product context

`apps/web/components/hermes-pairing-card.tsx` currently handles onboarding, pairing command display, status polling, Integration deletion, Flow list, Flow Replay, and timeline details. It works, but it is becoming a shallow module and a likely source of future mess.

AIFlows should remain SaaS-first and focused on beautiful shallow Flow Replay, not raw debugging logs.

## Scope

Extract focused UI modules from the current component, such as:

- Integration onboarding / pairing command card.
- Mission Control connected-state view.
- Flow list.
- Flow Replay panel.
- Timeline / Step detail presentation if useful.

Preserve current user-facing behavior:

- no Integration → guided Hermes onboarding;
- pending Integration → pairing command/status polling;
- connected/syncing/offline/error Integration → Mission Control;
- delete Integration still works;
- Flow Replay still shows graph/timeline/detail information.

## Out of scope

- Visual redesign.
- New product behavior.
- React Flow feature expansion.
- Supabase schema/API changes unless required by the refactor.
- Raw debugging/forensic Step views.

## Implementation notes

Keep this a pure/mostly-pure refactor. Avoid mixing with dependency upgrades or DB typing.

Suggested seams:

```text
components/hermes-integration-onboarding.tsx
components/mission-control-view.tsx
components/flow-list.tsx
components/flow-replay.tsx
components/step-timeline.tsx
```

Names can differ if the existing project conventions suggest better names.

the implementation agent should use OpenCode for a bounded refactor/review if available, then inspect diffs manually and run verification.

## Acceptance criteria

- [ ] `hermes-pairing-card.tsx` is smaller and delegates major UI sections to focused components.
- [ ] No visible behavior is intentionally changed.
- [ ] Flow Graph, Flow list, timeline, final answer, polling, and delete behavior still exist.
- [ ] Component names communicate product concepts from `CONTEXT.md`.
- [ ] Tests/build pass.

## Verification commands

```bash
npm run typecheck
npm test
npm run build
```

Manual check if running locally:

```text
Open the app, login/onboard if configured, confirm the no-Integration and connected Mission Control states still render.
```

## Blocked by

- Issue 016 is recommended first, so typed data shapes are clearer before UI extraction.

## External setup rule

If local manual verification requires external Supabase/Vercel setup that is not already complete, update `docs/setup.md`, document the required external steps, and require confirmation before relying on that setup.
