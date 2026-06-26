# AIFlows

AIFlows is a local Hermes trace visualizer project. The current implementation is a storage/API/static-UI tracer bullet.

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
curl http://127.0.0.1:3417/
curl http://127.0.0.1:3417/health
curl http://127.0.0.1:3417/api/latest-trace
```

Endpoints:

- `GET /` returns a static HTML tracer-bullet UI. Open `http://127.0.0.1:3417/` in a browser on the machine running Hermes, or forward the port over SSH and open the forwarded localhost URL.
- `GET /health` returns `{ "ok": true }`.
- `GET /api/latest-trace` reads `/root/.hermes/state.db` read-only and returns the latest normalized `RunTrace` JSON.

## Phase 3 tracer bullet: static browser UI

The static UI served at `/` proves `browser -> localhost API -> real Hermes trace visible` without React, Vite, React Flow, polling, or external dependencies. Browser JavaScript fetches `/health` and `/api/latest-trace`, then renders:

- health OK/error
- trace source
- prompt preview
- final answer preview
- event count
- a simple list of event types and titles

If a fetch fails, the page renders a readable error in the affected section.

Intentional tracer-bullet limits:

- no React/Vite UI framework
- no React Flow
- no polling
- no profile selector
- no arbitrary filesystem paths
- no writes to Hermes `state.db`
- no network binding beyond `127.0.0.1`
