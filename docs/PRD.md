# PRD: AIFlows v0 — Hermes Trace Visualizer

## Problem Statement

Hermes users can prompt their agents from places like Telegram or the CLI, but the execution is mostly experienced as a linear chat answer. For a technical reviewer, mentor, or senior developer, it is hard to quickly see what actually happened during a Hermes turn: what the user asked, whether the agent used tools, what tool results came back, and where the final answer fits in the execution path.

Krzysztof needs a first working demo that proves he can build a real app, not just a mockup. The demo should show progress toward an agent observability product by visualizing real Hermes activity from local profile storage. The first version should be small, truthful, and technically credible.

## Solution

AIFlows v0 is a local developer web dashboard that watches one selected local Hermes profile and turns each completed Hermes user→assistant turn into a visual trace graph using React Flow.

The user continues using Hermes normally from Telegram or the CLI. AIFlows reads the selected profile's local Hermes `state.db`, detects completed turns after Hermes answers, normalizes the observable messages/tool calls/tool results into trace events, and renders a graph for each trace.

AIFlows does not run Hermes, does not control agents, and does not show private chain-of-thought. It visualizes observable Hermes execution data.

### Product sentence

> AIFlows watches one Hermes profile and turns each completed Hermes turn into a visual trace graph.

### v0 demo promise

1. Start AIFlows locally on the same VPS/machine as Hermes.
2. Open the AIFlows dashboard in a browser.
3. Select one Hermes profile.
4. Prompt Hermes normally from Telegram or CLI.
5. After Hermes finishes answering, AIFlows automatically detects the completed turn.
6. AIFlows shows a new trace in the sidebar and renders its React Flow graph.

## Target User / Demo Context

Primary v0 user:

1. A developer using Hermes locally or on a VPS.
2. A senior developer reviewing whether Krzysztof can build a functioning web app.
3. Krzysztof, using the project to demonstrate practical web-app implementation, data parsing, and product thinking.

v0 is a local developer demo, not a deployed SaaS product.

## User Stories

1. As a Hermes user, I want to select one local Hermes profile, so that AIFlows knows which profile to watch.
2. As a Hermes user, I want AIFlows to show whether it is watching a profile, so that I know the app is connected to local Hermes storage.
3. As a Hermes user, I want to keep prompting Hermes from Telegram or CLI, so that AIFlows does not interrupt my existing workflow.
4. As a Hermes user, I want AIFlows to detect new completed turns automatically, so that I do not need to upload logs or manually refresh files.
5. As a Hermes user, I want each completed turn to appear as a trace in a sidebar, so that I can browse recent Hermes activity.
6. As a Hermes user, I want each trace to show its source when detectable, so that I can distinguish Telegram, CLI, or unknown-origin turns.
7. As a Hermes user, I want each trace to show a prompt preview, so that I can recognize which turn I am inspecting.
8. As a Hermes user, I want each trace to show a timestamp, so that I can identify recent activity quickly.
9. As a Hermes user, I want selecting a trace to render a React Flow graph, so that I can visually inspect the execution path.
10. As a Hermes user, I want the graph to always include the user prompt, so that the trace starts with the original task.
11. As a Hermes user, I want the graph to include the final assistant response, so that I can see the outcome of the turn.
12. As a Hermes user, I want tool calls to appear as graph nodes when Hermes stored them, so that I can see which tools the agent used.
13. As a Hermes user, I want tool results to appear as graph nodes when Hermes stored them, so that I can inspect what came back from tools.
14. As a Hermes user, I want traces with no tool calls to still render cleanly, so that ordinary chat turns still work.
15. As a Hermes user, I want to click a node and see details, so that long prompts, responses, or tool results are readable outside the graph node.
16. As a Hermes user, I want AIFlows to avoid fake reasoning nodes, so that the visualization remains truthful and technically credible.
17. As a reviewer, I want the app to use real Hermes data, so that I can evaluate an actual integration rather than a static mock.
18. As a reviewer, I want the app to have a clear local-dev setup, so that I can run it and verify behavior quickly.
19. As a developer, I want the backend to expose simple JSON APIs, so that the frontend can remain focused on visualization.
20. As a developer, I want a normalized trace model separate from Hermes raw database rows, so that future adapters can be added without rewriting the UI.
21. As a developer, I want React Flow nodes and edges generated from normalized trace events, so that graph rendering stays decoupled from database parsing.
22. As a developer, I want polling instead of WebSockets for v0, so that live-after-answer behavior is simpler and less error-prone.
23. As a developer, I want the app to treat one user→assistant exchange as a trace, so that long Hermes sessions do not become one giant graph.
24. As a developer, I want intermediate assistant messages with tool calls to be treated differently from final assistant answers, so that graph structure reflects Hermes execution accurately.
25. As a developer, I want v0 to work with either Telegram or CLI-origin turns when source is detectable, so that the demo is not blocked by platform-specific filtering.

## Implementation Decisions

### Stack

- Frontend: React + Vite + TypeScript + React Flow.
- Backend: Node.js + Express + TypeScript.
- SQLite reader: prefer `better-sqlite3` for simple synchronous reads; if native install issues appear, fall back to another SQLite package.
- Local developer mode first; deployment packaging is not part of v0.

### Hermes data source

AIFlows v0 reads local Hermes profile storage from the selected profile's `state.db`.

Observed Hermes profile structure:

- Profiles live under the Hermes profiles directory.
- Each profile has a `state.db` SQLite database.
- The database includes `sessions` and `messages` tables.

Observed `sessions` fields useful to AIFlows:

- `id`
- `source`
- `user_id`
- `model`
- `started_at`
- `ended_at`
- `title`
- `message_count`
- `tool_call_count`

Observed `messages` fields useful to AIFlows:

- `id`
- `session_id`
- `role`
- `content`
- `tool_call_id`
- `tool_calls`
- `tool_name`
- `timestamp`
- `finish_reason`
- `platform_message_id`

### Trace definition

A trace is one completed Hermes user→assistant turn, not an entire Hermes session.

A completed v0 trace starts at a `messages.role = "user"` row and ends at a later `messages.role = "assistant"` row with `finish_reason = "stop"`.

Messages between the starting user message and final assistant message are included when relevant:

- assistant messages with `finish_reason = "tool_calls"` become tool-call events when `tool_calls` is present.
- tool messages become tool-result events.
- assistant message with `finish_reason = "stop"` becomes the final answer event.

### Source badge

AIFlows should show the source if detectable from the related Hermes session, for example:

- `telegram`
- `cli`
- `unknown`

v0 should not filter only Telegram. It should show any new completed turn from the selected profile, with a source badge where available.

### Normalized data model

The backend should convert raw Hermes rows into a stable app-level model before the frontend sees them.

Conceptual shape:

```ts
type RunTrace = {
  id: string;
  profile: string;
  sessionId: string;
  source: "telegram" | "cli" | "unknown" | string;
  status: "completed";
  startedAt: string;
  finishedAt: string;
  promptPreview: string;
  finalAnswerPreview: string;
  events: TraceEvent[];
};

type TraceEvent = {
  id: string;
  type:
    | "user_prompt"
    | "tool_call"
    | "tool_result"
    | "assistant_response"
    | "error";
  title: string;
  content?: string;
  timestamp?: string;
  toolName?: string;
  raw?: unknown;
};
```

### React Flow graph behavior

The frontend converts `TraceEvent[]` into React Flow nodes and edges.

Minimum graph:

```text
[User Prompt] → [Assistant Response]
```

Tool-rich graph:

```text
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

Graph rules:

- Nodes must represent real observable Hermes data.
- Edges should show chronological flow.
- The selected trace is rendered in the main graph canvas.
- The sidebar lists recent traces.
- Clicking a node shows full details in a details panel.
- React Flow is used as a visualization layer, not an editable workflow builder.

### Polling behavior

v0 should use polling, not WebSockets.

Suggested behavior:

- Backend reads/polls the selected profile database.
- Frontend polls backend endpoints every ~2 seconds.
- New traces appear automatically after Hermes completes an answer.

The v0 experience is “live after answer,” not true real-time streaming while Hermes is thinking.

### API shape

The exact endpoint names may change, but v0 should expose simple API seams equivalent to:

- list available profiles
- list recent traces for selected profile
- get a selected trace with normalized events

The frontend should not read SQLite directly.

## Testing Decisions

Testing should focus on external behavior and stable seams, not implementation details.

### Highest-value seam

The most important seam is the Hermes storage parser / trace normalizer:

```text
Hermes SQLite rows → normalized RunTrace
```

This is the core product behavior. If this works, the UI can remain relatively simple.

### Recommended tests

1. Given a simple user→assistant message sequence, the parser returns one completed trace.
2. Given a user→assistant(tool_calls)→tool→assistant(stop) sequence, the parser returns one trace with tool-call and tool-result events in order.
3. Given a user message without a final assistant `finish_reason = "stop"`, the parser does not emit a completed trace for v0.
4. Given sessions with different sources, traces include the correct source badge.
5. Given multiple turns in one session, the parser emits multiple traces rather than one session-sized trace.
6. Given messages with no tool calls, the frontend still renders a valid two-node graph.
7. Given a selected trace, the React Flow node generation creates chronological nodes and edges.

### Manual demo test

1. Start AIFlows locally.
2. Select a Hermes profile.
3. Prompt that Hermes profile from Telegram or CLI.
4. Wait for Hermes to finish.
5. Verify a new trace appears automatically.
6. Select the trace.
7. Verify the graph contains real prompt/response data.
8. If the turn used tools, verify tool call/result nodes appear.

## Out of Scope

v0 explicitly does not include:

- running Hermes from AIFlows
- prompting agents from the AIFlows UI
- connecting arbitrary remote Hermes installations
- connecting ChatGPT web, Claude web, OpenAI, OpenRouter, OpenCode, or Claude Code
- watching multiple Hermes profiles at once
- user accounts or authentication
- deployed SaaS hosting
- remote connector installation
- WebSocket/SSE streaming
- token-by-token streaming
- showing private chain-of-thought
- inventing/faking reasoning or planning nodes
- editable workflow graphs
- workflow builder functionality
- multi-agent orchestration UI
- manual log upload/import workflow
- modifying Hermes internals

## Success Criteria

AIFlows v0 is successful when:

1. It runs locally in developer mode.
2. It can discover or use one selected Hermes profile.
3. It reads real Hermes `state.db` data.
4. It detects completed user→assistant turns.
5. It shows recent traces in the UI.
6. It renders the selected trace as a React Flow graph.
7. It includes tool-call/tool-result nodes when the data exists.
8. It falls back gracefully to user prompt → assistant response when no tool data exists.
9. It automatically shows new traces after Hermes finishes answering.
10. It avoids fake chain-of-thought or invented workflow steps.

## Implementation Phases

### Phase 1 — Storage tracer bullet

Goal: prove the app can read Hermes profile storage and output real trace JSON.

Tracer bullets:

1. Read one selected profile's `state.db`.
2. List recent sessions with source badges.
3. Find recent completed user→assistant turns.
4. Normalize the latest completed turn into `RunTrace` JSON.
5. Include tool-call/tool-result events if present.

Exit criteria:

- A local script or backend endpoint prints valid trace JSON from real Hermes data.

### Phase 2 — Backend API

Goal: expose the trace data through a simple Node/Express API.

Tracer bullets:

1. Create an Express server.
2. Add profile listing or configured-profile selection.
3. Add endpoint for recent traces.
4. Add endpoint for one trace's full event list.
5. Add basic error handling for missing profile or missing database.

Exit criteria:

- Browser or curl can retrieve recent traces as JSON.

### Phase 3 — React dashboard skeleton

Goal: create the basic dashboard layout.

Tracer bullets:

1. Create Vite React TypeScript frontend.
2. Add profile selector/status header.
3. Add recent traces sidebar.
4. Add selected trace state.
5. Poll backend every ~2 seconds.

Exit criteria:

- New completed traces appear in the sidebar without manual reload.

### Phase 4 — React Flow visualization

Goal: render selected traces as graphs.

Tracer bullets:

1. Convert trace events to React Flow nodes and edges.
2. Render user prompt and assistant response nodes.
3. Render tool-call and tool-result nodes when available.
4. Add source/status/time metadata.
5. Add selected node detail panel.

Exit criteria:

- Selecting a trace renders a truthful React Flow graph from real Hermes data.

### Phase 5 — Demo polish

Goal: make the local developer demo understandable and presentable.

Tracer bullets:

1. Improve empty/loading/error states.
2. Add readable node styling.
3. Add prompt/answer previews.
4. Add setup instructions to README.
5. Add a manual demo checklist.

Exit criteria:

- Krzysztof can run the app locally, prompt Hermes, and show a new trace graph appearing after Hermes answers.

## Further Notes

The strongest positioning for v0 is observability, not orchestration.

Recommended language:

> AIFlows visualizes observable Hermes execution traces.

Avoid saying:

> AIFlows shows the agent's thought process.

That wording is misleading because private chain-of-thought is not exposed and should not be required for the product to be valuable.

Long-term possibilities after v0:

- running-state traces while Hermes is still answering
- WebSocket/SSE live updates
- multiple profile watching
- remote connector for another user's Hermes VPS
- richer multi-agent/delegation visualization
- OpenCode/Claude Code adapters
- workflow graph mode for actual multi-agent orchestration
- import/export of traces
- sharing traces with reviewers
