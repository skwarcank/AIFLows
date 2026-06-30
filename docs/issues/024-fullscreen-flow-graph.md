# Issue 024: Add fullscreen presentation mode for the Flow graph

## Goal

Make the Flow graph feel like the hero feature by adding an immersive fullscreen presentation mode with a large graph canvas, clean controls, legend button, and reusable node details drawer.

## Product context

The graph should be available in a larger fullscreen mode because it is a primary product feature. Fullscreen should not simply enlarge raw data; it should present the Story graph clearly and let reviewers inspect evidence on demand.

## Scope

- Add a fullscreen/open-expanded control to the Flow Replay graph.
- Fullscreen opens in Story/presentation mode by default.
- Provide essential graph controls:
  - exit fullscreen
  - fit to screen
  - zoom in/out if supported by the graph library
  - legend button/popover
- Reuse compact Story graph nodes from Issue 022.
- Reuse node details drawer from Issue 023, preferably as a right-side drawer in fullscreen.
- Keep fullscreen canvas clean: no permanent legend panel, no raw JSON on nodes.
- Ensure the fullscreen view works at common laptop/desktop sizes.
- Preserve normal page Flow Replay layout.

## Out of scope

- Inline expandable grouped TraceSteps.
- Story/Raw graph toggle if not already available.
- Mini-map/search/filter unless trivial and non-disruptive.
- Mobile-perfect fullscreen UX.
- Major graph layout engine replacement unless current behavior blocks the slice.

## UX/design notes

Fullscreen should feel like entering the trace:

```text
[Fit] [Zoom -] [Zoom +] [Legend] [Exit]

          💬 User request
                ↓
          ✅ Planned approach
                ↓
          📚 Gathered context
                ↓
          🛠 Used tools / created artifact
                ↓
          🎯 Delivered result
```

Legend belongs behind a button/popover:

```text
💬 Conversation
✅ Planning
📚 Context gathering
🧠 Analysis
🛠 Tool action
📄 Artifact creation/editing
🧪 Verification
⚠️ Error/recovery
🎯 Final result
```

Clicking a node opens the drawer; the canvas remains readable and presentation-first.

## Implementation notes / likely seams

- If the app already uses React Flow, prefer built-in viewport controls where practical.
- Keep fullscreen state local to Flow Replay unless there is a clear app-wide modal pattern.
- Ensure keyboard escape/backdrop/close behavior is predictable.
- Avoid introducing layout jitter that makes demos feel fragile.

the implementation agent process reminders:

- Read project docs/ADRs first.
- Use real app verification, not only static inspection.
- Use OpenCode for a bounded review if useful, but verify yourself.
- Run real verification before reporting success.

## Acceptance criteria

- [ ] User can open the Flow graph in fullscreen/immersive mode.
- [ ] Fullscreen defaults to clean Story graph presentation.
- [ ] Fullscreen includes fit, zoom if available, legend button, and exit controls.
- [ ] Legend appears in a popover/overlay, not permanently on the canvas.
- [ ] Clicking a fullscreen node opens the details drawer without leaving fullscreen.
- [ ] Normal page Flow Replay still works.
- [ ] The fullscreen graph is meaningfully larger and more readable than the embedded graph.

## Blocked by

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
- Enter fullscreen.
- Use fit/zoom controls.
- Open/close legend.
- Click a node and confirm the drawer works.
- Exit fullscreen and confirm normal page state remains usable.
