# AIFlows

AIFlows is a local Hermes trace visualizer project. The current implementation is only a storage/API tracer bullet.

## Phase 1: read the latest Hermes trace

This tracer bullet reads the known local Hermes database at `/root/.hermes/state.db` in read-only mode and prints one normalized `RunTrace` JSON object.

Requirements:

- Node.js 22+ with the experimental built-in SQLite module.
- A readable Hermes SQLite database at `/root/.hermes/state.db`.

Run the CLI:

```bash
node --experimental-sqlite --no-warnings scripts/read-latest-trace.js
```

The output includes at least:

- one `user_prompt` event
- one `assistant_response` event

If Hermes stored tool calls/results between the prompt and final assistant response, the script also includes `tool_call` and `tool_result` events. Malformed tool-call JSON is reported as an `error` event instead of crashing the trace.

## Phase 2 tracer bullet: localhost HTTP API

This tracer bullet exposes the same normalized `RunTrace` JSON through a tiny dependency-free HTTP server. It binds to `127.0.0.1` only.

Run the server:

```bash
node --experimental-sqlite --no-warnings scripts/serve-latest-trace.js
```

Optional port override:

```bash
PORT=3420 node --experimental-sqlite --no-warnings scripts/serve-latest-trace.js
```

Check it from another shell:

```bash
curl http://127.0.0.1:3417/health
curl http://127.0.0.1:3417/api/latest-trace
```

Endpoints:

- `GET /health` returns `{ "ok": true }`.
- `GET /api/latest-trace` reads `/root/.hermes/state.db` read-only and returns the latest normalized `RunTrace` JSON.

Intentional tracer-bullet limits:

- no React/Vite UI
- no polling
- no profile selector
- no arbitrary filesystem paths
- no writes to Hermes `state.db`
- no network binding beyond `127.0.0.1`
