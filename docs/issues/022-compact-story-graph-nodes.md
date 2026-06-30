# Issue 022: Render compact story graph nodes with category styling

## Goal

Render `TraceStep`s as compact, readable graph cards so the Flow graph becomes understandable at a glance instead of looking like raw event/debug data.

## Product context

The graph is the hero feature of AIFlows. It should explain what the agent did in a user-friendly way while still being grounded in real observable trace data. This slice turns the new TraceStep model into the first visible graph improvement.

## Scope

- Update the Flow Replay graph to render Story view nodes from `TraceStep`s.
- Use compact node cards with:
  - icon
  - domain-specific title
  - generic category label
  - source event/step count
  - status indicator
- Add category-based visual styling for:
  - Conversation
  - Planning
  - Context gathering
  - Analysis
  - Tool action
  - Artifact creation/editing
  - Verification
  - Error/recovery
  - Final result
- Keep node text short: title + small metadata, not paragraphs.
- Add a legend button or reusable legend data structure if easy, but the fullscreen legend interaction can wait for the fullscreen issue.
- Ensure collapsed/error state is visually obvious enough for later grouping work.
- Add tests or component fixtures where practical.

## Out of scope

- Fullscreen presentation mode.
- Right-side details drawer.
- Inline expansion of grouped nodes.
- Raw graph toggle.
- Tool-specific evidence cards.
- Large layout algorithm rewrites unless necessary for current graph stability.

## UX/design notes

Preferred node shape:

```text
📚 Inspected codebase
Context gathering · 7 events · ✓
```

The visual system should use mostly consistent card shapes. Distinguish categories with icon, accent color, and metadata rather than wildly different shapes.

Use generic category styling with domain-specific node titles:

```text
📚 Inspected codebase
Context gathering · 4 events
```

```text
📚 Researched travel options
Context gathering · 5 events
```

This keeps AIFlows useful beyond coding/programming conversations.

## Implementation notes / likely seams

- Build on Issue 021's `TraceStep` model and interpreter.
- Keep styling accessible: enough contrast, readable text, no tiny metadata.
- Prefer a small centralized category-to-icon/color mapping so future adapters/tools can reuse it.
- The graph should remain readable with shallow Step data; do not introduce fake summaries.

the implementation agent process reminders:

- Read project docs/ADRs first.
- Preserve the product direction: beautiful Mission Control, not a raw debugging console.
- Use OpenCode for a bounded review if useful, but verify yourself.
- Run real verification before reporting success.

## Acceptance criteria

- [ ] Flow Replay graph renders from TraceSteps in Story view.
- [ ] Nodes show compact human-readable title + category/event/status metadata.
- [ ] Category icon/color styling is consistent and centralized.
- [ ] Coding and non-coding-shaped TraceSteps both render sensibly.
- [ ] Error/recovery nodes are visually distinct.
- [ ] Graph no longer puts raw JSON/tool payload text directly on normal Story nodes.
- [ ] Tests/fixtures cover representative categories where practical.

## Blocked by

- Issue 021: Introduce TraceStep story model for Flow Replay

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Manual check:

- Open Flow Replay with mocked/seeded data.
- Confirm the graph can be understood in a few seconds from node titles and metadata.
- Confirm no raw JSON blob appears on the main Story graph canvas.
