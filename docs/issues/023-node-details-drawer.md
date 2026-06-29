# Issue 023: Add node details drawer for explanation, evidence, and raw JSON

## Goal

Let users click a Story graph node and inspect a clean details drawer that explains the step, shows the outcome/evidence, and provides pretty raw JSON only when needed.

## Product context

The graph canvas should stay presentation-friendly, but technical reviewers still need trust and evidence. The drawer is the credibility layer: it proves that readable Story nodes are grounded in real stored Flow/Step data.

## Scope

- Add a node details drawer/panel in Flow Replay.
- On Story node click, show details for the selected TraceStep.
- Default drawer order:
  1. Human explanation
  2. Outcome
  3. Evidence
  4. Raw events/data collapsed by default
- Show source step/event count and status.
- Show source references in a readable way using the available shallow Step metadata.
- Pretty-print raw JSON in a collapsed section.
- Include basic copy affordance for raw JSON if easy, but do not let this block the slice.
- Ensure the drawer works in the normal page graph and can be reused by fullscreen later.

## Out of scope

- Fullscreen graph shell.
- Tool-specific evidence cards.
- Inline expandable group rendering.
- Story/Raw graph toggle.
- LLM-generated explanations.

## UX/design notes

Desired drawer shape:

```text
## Inspected codebase

The agent gathered context from project files to understand how the graph is implemented.

### Outcome
Found the graph component and trace transformation logic.

### Evidence
- Source steps: 7
- Tools/categories: context gathering, file inspection
- Status: success

### Raw events
[Show JSON]
```

The drawer should make the graph feel honest, not noisy. Raw JSON should be available but not the first thing users see.

Errors deserve special treatment:

- If selected TraceStep has an error, show what failed.
- Show raw error/output preview if available in the shallow data.
- Show recovery/next step references if the TraceStep model exposes them.

## Implementation notes / likely seams

- Reuse the selected-node state from the graph if it already exists.
- Keep the drawer independent from fullscreen so Issue 024 can mount it in the immersive graph shell.
- Do not expose full raw Hermes database rows or full raw tool outputs if those are not already part of the stored shallow payload policy.
- Pretty JSON means indentation and readable monospace at minimum; syntax highlighting is nice but optional.

Amon process reminders:

- Read project docs/ADRs first.
- Keep shallow content policy intact.
- Use OpenCode for bounded implementation/review if useful, but verify yourself.
- Run real verification before reporting success.

## Acceptance criteria

- [ ] Clicking a Story graph node opens a details drawer/panel.
- [ ] Drawer shows explanation, outcome, evidence, and collapsed pretty raw JSON in that order.
- [ ] Drawer content is based on TraceStep/source Step data, not invented chain-of-thought.
- [ ] Raw JSON is formatted readably and hidden by default.
- [ ] Error TraceSteps show failure information prominently.
- [ ] Drawer can be reused from fullscreen mode without major rewrite.
- [ ] Tests or component coverage exist where practical.

## Blocked by

- Issue 021: Introduce TraceStep story model for Flow Replay
- Issue 022: Render compact story graph nodes with category styling

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Manual check:

- Open Flow Replay.
- Click at least three node categories, including an error-shaped fixture if available.
- Confirm raw JSON is pretty, collapsed by default, and not shown on the main graph canvas.
