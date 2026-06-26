# Demo polish — empty states, styling, README

## Parent

PRD: `docs/PRD.md` — Phase 5 (Demo polish).

## What to build

Polish the app so it's presentable as a local developer demo to a reviewer (e.g. a senior developer evaluating Krzysztof's work). This slice focuses on UX refinement, error handling, and documentation — no new features.

### Empty / loading / error states

Every data-dependent component should handle these three states:

- **Loading** — show a clear loading indicator (skeleton or spinner) while data is being fetched. Not a blank flash.
- **Empty** — show a friendly message when data is expected but none exists (e.g. "No traces yet — prompt Hermes from Telegram or CLI").
- **Error** — show a readable error message when a fetch fails, with the option to retry. Don't crash the whole page.

Components that need these states:
- Profile selector (loading profiles, error loading profiles, no profiles found)
- Trace sidebar (loading traces, error loading traces, no traces found)
- Graph area (loading trace details, error loading trace, no trace selected placeholder)
- Node detail panel (no node selected placeholder)

### Node styling

Make the React Flow nodes visually readable and scannable:

- Distinct background colors per event type (e.g. blue for user_prompt, amber for tool_call, green for tool_result, purple for assistant_response, red for error)
- Consistent border radius, font, and sizing
- Node label shows the event title (e.g. "Tool Call: search_files")
- Node shows a truncated content preview (first 2-3 lines or ~100 chars)
- Selected node has a highlight border
- Source badge colors match the trace level (telegram=blue, cli=gray, unknown=yellow)

### Detail panel

The node detail panel should be readable and useful:

- Show the event type as a header
- Show `toolName` if present
- Show the full `content` in a scrollable, monospace block — preserve newlines and whitespace
- For JSON content (tool call arguments, tool results), consider syntax highlighting or at least indented formatting
- Show the event timestamp
- Close button or click-outside-to-close

### Sidebar trace cards

Improve the trace cards from Slice 2:

- Show full source badge with color
- Show prompt preview (truncated with ellipsis)
- Show relative timestamp ("2m ago", "1h ago")
- Show final answer preview as a second line (lighter weight)
- Selected trace is visually distinct (highlighted background)
- Cards have reasonable max-width and text overflow handling

### Documentation

- Update or create `README.md` at the project root with:
  - What AIFlows is (one-liner + screenshot or ASCII-art placeholder)
  - Prerequisites (Node.js 22+, Hermes installed with a profile)
  - Quick start: clone, install, configure, run
  - Architecture overview: backend reads Hermes `state.db`, frontend polls backend
  - Demo walkthrough: step-by-step from "start the app" to "see a trace graph appear"
  - Manual demo checklist (from PRD)
- Update `docs/dev-notes.md` to reflect current state

### What not to build

- No significant new features
- No deployment configuration
- No tests (testing is covered by the PRD's test criteria — they should be added in earlier slices)
- No analytics or telemetry
- No theme switcher (light mode only is fine for v0)

## Acceptance criteria

- [ ] Profile selector shows loading skeleton, empty message ("No Hermes profiles found"), and error retry
- [ ] Trace sidebar shows loading skeleton, empty message ("No traces yet — prompt Hermes"), and error retry
- [ ] Graph area shows specific placeholder when no trace is selected
- [ ] Graph area shows loading state while fetching trace details
- [ ] Graph area shows error state with retry if trace fetch fails
- [ ] React Flow nodes have distinct colors per event type
- [ ] Node content is truncated inside the node, full content visible in detail panel
- [ ] Selected node has a visible highlight (border or glow)
- [ ] Detail panel shows full event content in a scrollable monospace view
- [ ] Detail panel can be closed
- [ ] Sidebar trace cards show source badge, prompt preview, and relative timestamp
- [ ] Selected trace card is visually distinct
- [ ] `README.md` exists with quick start instructions and demo walkthrough
- [ ] A reviewer can follow the README to run the app and see a real Hermes trace graph without asking for help

## Blocked by

- Slice 3 (needs the graph, detail panel, sidebar, and profile selector to exist before they can be polished)
