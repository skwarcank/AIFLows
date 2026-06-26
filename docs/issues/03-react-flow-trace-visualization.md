# React Flow trace visualization

## Parent

PRD: `docs/PRD.md` — Phase 4 (React Flow visualization).

## What to build

Add React Flow to the dashboard and render the selected trace's events as an interactive directed graph. This is the core visual feature of AIFlows.

### Graph layout

The graph flows top-to-bottom showing the chronological execution path:

```
[User Prompt]
     ↓
[Tool Call: search_files]
     ↓
[Tool Result]
     ↓
[Tool Call: read_file]
     ↓
[Tool Result]
     ↓
[Assistant Response]
```

For simple no-tool traces:

```
[User Prompt] → [Assistant Response]
```

### Node types and rendering

Each `TraceEvent.type` maps to a distinct React Flow node type:

| Event type | Node rendering |
|---|---|
| `user_prompt` | Neutral/input style. Shows truncated content preview. Positioned as first node. |
| `tool_call` | Distinct color (e.g. amber/orange). Shows `toolName` as subtitle. |
| `tool_result` | Distinct color (e.g. green). Shows truncated content preview. |
| `assistant_response` | Accent/output style. Shows truncated content preview. Positioned as last node. |
| `error` | Red/warning style. Shows error message. |

### Edge rendering

- Edges connect nodes in chronological order (the order of `TraceEvent` in the `events` array).
- Edge labels are optional for v0 — a simple directed arrow is sufficient.

### Interaction

- **Pan and zoom** — standard React Flow canvas navigation.
- **Click node** → opens a detail panel (to the right or below the graph) showing the full event content in a scrollable area.
- **Detail panel** — displays the event's full `content` without truncation. For tool calls, show the JSON arguments. For tool results, show the result content. Consider simple formatting (preserve newlines, monospace font).
- The detail panel should close when clicking another node or clicking a close button.

### Graph generation

- Convert the selected trace's `TraceEvent[]` → React Flow nodes and edges.
- Each node should carry enough data for rendering and the detail panel (label, content, type, toolName, etc.).

### What not to build

- No editable graph (React Flow is view-only for v0)
- No mini-map or controls yet (can be added in polish)
- No custom edge labels with icons
- No animation
- No multi-trace comparison

## Acceptance criteria

- [ ] React Flow is installed and renders in the main content area when a trace is selected
- [ ] For a trace with no tool calls, the graph shows exactly 2 nodes: `user_prompt` and `assistant_response`, connected by an edge
- [ ] For a trace with tool calls, the graph shows all events in correct chronological order with edges between consecutive events
- [ ] Each node type has visually distinct rendering (different colors or shapes)
- [ ] Node content is truncated to fit in a reasonable node size
- [ ] Clicking a node opens a detail panel showing the full content without truncation
- [ ] Clicking a different node updates the detail panel
- [ ] Clicking the close button or clicking outside closes the detail panel
- [ ] The graph is fully navigable (pan, zoom)
- [ ] Selecting a different trace from the sidebar replaces the graph content
- [ ] An empty trace (no events) shows a friendly error/message in the graph area (not a crash)
- [ ] The graph does not show any fake/invented nodes — only real events from Hermes data

## Blocked by

- Slice 2 (needs the dashboard shell with profile selection and trace list)
