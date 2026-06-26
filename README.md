# AIFlows — Hermes Trace Visualizer

AIFlows watches a local Hermes profile and visualises completed agent turns as
interactive React Flow graphs.

```
        Hermes Agent
      (Telegram / CLI)
             │
             ▼  writes to state.db
     ┌───────────────┐
     │ Hermes Profile │
     │   state.db     │
     └───────┬───────┘
             │ reads (read-only)
     ┌───────┴───────┐
     │  AIFlows API  │  Express + TypeScript
     │ :3417         │
     └───────┬───────┘
             │ JSON polling (~2s)
     ┌───────┴───────┐
     │ AIFlows UI    │  Vite + React + React Flow
     │ :5173         │
     └───────────────┘
```

## Prerequisites

- **Node.js 22+** (tested with v22.23.0)
- **Hermes Agent** installed and running with at least one active profile
- A modern browser (Chrome, Firefox, Edge)

## Quick start

```bash
# 1. Clone and install
git clone <repo-url> aiflows
cd aiflows
npm install

# 2. Build the frontend
npm run build -w packages/frontend

# 3. Start the backend (serves API + frontend)
HERMES_PROFILES_DIR=~/.hermes/profiles npm start

# 4. Open in browser
open http://127.0.0.1:3417
```

### Development mode (two terminals)

```bash
# Terminal 1: backend with hot reload
npm run dev:backend

# Terminal 2: frontend with HMR
npm run dev:frontend
```

Then open `http://127.0.0.1:5173` (Vite dev server proxies `/api/*` to backend).

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3417` | Backend HTTP port |
| `HERMES_PROFILES_DIR` | `~/.hermes/profiles` | Directory containing Hermes profile folders |
| `VITE_API_URL` | `http://127.0.0.1:3417` | Backend URL for Vite dev proxy |

## Architecture

```
packages/
├── backend/          Express + TypeScript API
│   ├── src/
│   │   ├── index.ts          Server setup, route handlers
│   │   ├── types.ts          RunTrace / TraceEvent models
│   │   ├── trace-reader.ts   SQLite query → normalized traces
│   │   └── profiles.ts       Profile discovery
│   └── __tests__/
│       └── trace-reader.test.ts
└── frontend/         Vite + React + React Flow dashboard
    ├── src/
    │   ├── App.tsx           Main layout, polling, state
    │   ├── api.ts            Backend fetch helpers
    │   ├── types.ts          Shared types
    │   └── components/
    │       ├── ProfileSelector.tsx
    │       ├── StatusIndicator.tsx
    │       ├── TraceSidebar.tsx
    │       ├── TraceCard.tsx
    │       ├── MainContent.tsx
    │       ├── GraphView.tsx
    │       └── DetailPanel.tsx
    └── style.css
```

### Key decisions

- **Read-only** — AIFlows never writes to Hermes storage.
- **Polling** — Frontend polls backend every ~2s. No WebSockets in v0.
- **Normalised model** — Backend converts raw Hermes rows into `RunTrace` /
  `TraceEvent` before the frontend sees them. Future adapters can reuse the UI.
- **Profile discovery** — Backend scans the Hermes profiles directory for
  subdirectories containing `state.db`.
- **Tool calls to `error` events** — Malformed tool-call JSON creates an `error`
  event instead of crashing the trace.

## Demo walkthrough

1. **Start Hermes** — Ensure Hermes is running and has at least one active
   profile (e.g. `default` or a named profile).

2. **Start AIFlows** — `npm start` from the project root. The backend scans
   `~/.hermes/profiles/` for available profiles.

3. **Open the dashboard** — Navigate to `http://127.0.0.1:3417` in a browser.

4. **Select a profile** — Choose a Hermes profile from the dropdown. The
   status indicator shows "Watching: profile-name".

5. **Prompt Hermes** — Send a message to Hermes from Telegram or CLI. Wait for
   Hermes to finish answering.

6. **Watch the trace appear** — After Hermes finishes, a new trace card appears
   in the sidebar within ~2 seconds.

7. **Click the trace** — The graph area shows the execution flow:
   - **User Prompt** → first node (blue)
   - **Tool Call** nodes (amber) — one per tool invocation
   - **Tool Result** nodes (green) — results from each tool
   - **Assistant Response** → last node (purple)

8. **Inspect details** — Click any node to see full content in the detail panel
   at the bottom. Scrollable monospace view preserves whitespace.

9. **Navigate** — Pan and zoom the graph canvas. Select different traces from
   the sidebar to compare runs.

## Demo checklist

- [ ] Backend starts without errors
- [ ] `GET /health` returns `{ "ok": true }`
- [ ] `GET /api/profiles` lists available profiles
- [ ] `GET /api/profiles/:id/traces` returns recent traces for a known profile
- [ ] `GET /api/traces/:traceId` returns full trace with events
- [ ] Unknown profile returns 404 JSON
- [ ] Profile selector shows loading skeleton, empty state, and error state
- [ ] Trace sidebar shows loading skeleton, empty state, and error state
- [ ] Graph area shows placeholder, loading, and error states
- [ ] Graph renders nodes with distinct colors per event type
- [ ] Detail panel shows full event content
- [ ] Polling detects new traces within ~2 seconds
- [ ] Backend-offline indicator shows when the server is unreachable
- [ ] Profile selection persists across page refresh

## Out of scope (v0)

- Running or controlling Hermes from AIFlows
- WebSocket / SSE streaming
- Authentication
- Multi-profile simultaneous watching
- Remote Hermes connections
- Editable workflow graphs
- Chain-of-thought visualisation
