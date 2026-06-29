# Issue 026: Add Story / Raw graph toggle for Flow Replay

## Goal

Add a clear toggle that lets users switch between the readable Story graph made of TraceSteps and a Raw trace graph made of the underlying stored events/Steps.

## Product context

AIFlows must satisfy both non-technical viewers and technical reviewers. Story view explains what happened. Raw view proves the Story graph comes from real observable data. This should improve trust without making the default experience noisy.

## Scope

- Add a graph view toggle, labelled clearly, such as:
  - `Story | Raw`
  - or `Story graph | Raw trace`
- Default to Story view.
- Story view uses TraceSteps and compact category nodes.
- Raw view shows the underlying stored Step/event sequence chronologically.
- Raw view nodes should be readable enough to inspect event type/tool/status, but can be more technical than Story view.
- Ensure node selection/drawer still works in both modes.
- In Raw view, details drawer should prioritize raw event/Step data and pretty JSON.
- Preserve shallow content policy: do not upload or expose forbidden raw Hermes internals.

## Out of scope

- Tool-specific evidence cards.
- Advanced filters/search.
- LLM explanations.
- Showing private model chain-of-thought.
- Changing connector retention/detail policy.

## UX/design notes

Default:

```text
View: Story | Raw
```

Story view:

```text
User request → Gathered context → Created artifact → Verified result → Delivered result
```

Raw view:

```text
user_message → assistant_message → tool_call → tool_result → assistant_message
```

The toggle is an escape hatch for reviewers/debugging. It should not make Raw view feel like the primary product.

## Implementation notes / likely seams

- Reuse existing stored Step data for Raw view; do not derive Raw view from TraceSteps.
- Keep the transformation auditable: Story TraceSteps should retain source step ids that can be compared with Raw view.
- If fullscreen exists, include the toggle there too, or use the same graph header controls in normal and fullscreen views.
- Consider preserving selected source/TraceStep context when toggling only if simple; otherwise clear selection safely.

Amon process reminders:

- Read project docs/ADRs first.
- Preserve AIFlows as Mission Control, not a raw debugging console.
- Use OpenCode for bounded implementation/review if useful, but verify yourself.
- Run real verification before reporting success.

## Acceptance criteria

- [ ] Flow Replay exposes a clear Story/Raw graph toggle.
- [ ] Story is the default view.
- [ ] Raw view shows stored event/Step sequence rather than TraceStep groups.
- [ ] Drawer works in Raw view and shows pretty raw JSON/details.
- [ ] Story TraceSteps retain source references that can be compared to Raw events.
- [ ] Toggle works in fullscreen if fullscreen graph controls are present.
- [ ] No forbidden raw Hermes DB rows, full raw tool outputs, or chain-of-thought are introduced.

## Blocked by

- Issue 021: Introduce TraceStep story model for Flow Replay
- Issue 022: Render compact story graph nodes with category styling
- Issue 023: Add node details drawer for explanation, evidence, and raw JSON

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Manual check:

- Open a Flow Replay.
- Confirm Story view is default.
- Toggle to Raw and inspect chronological raw nodes.
- Click nodes in both views and confirm drawer behavior.
- Confirm the Raw view is useful for verification but not visually dominant over Story view.
