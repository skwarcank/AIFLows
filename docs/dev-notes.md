# AIFlows

AIFlows is a local Hermes trace visualizer project. The current implementation is only the Phase 1 storage tracer bullet.

## Phase 1: read the latest Hermes trace

This tracer bullet reads the known local Hermes database at `/root/.hermes/state.db` in read-only mode and prints one normalized `RunTrace` JSON object.

Requirements:

- Node.js 22+ with the experimental built-in SQLite module.
- A readable Hermes SQLite database at `/root/.hermes/state.db`.

Run:

```bash
node --experimental-sqlite --no-warnings scripts/read-latest-trace.js
```

The output includes at least:

- one `user_prompt` event
- one `assistant_response` event

If Hermes stored tool calls/results between the prompt and final assistant response, the script also includes `tool_call` and `tool_result` events. Malformed tool-call JSON is reported as an `error` event instead of crashing the trace.

Intentional Phase 1 limits:

- no React/Vite UI
- no backend server
- no polling
- no profile selector
- no arbitrary filesystem paths
- no writes to Hermes `state.db`
