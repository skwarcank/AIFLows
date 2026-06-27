# AIFlows — Mission Control for Hermes Flows

AIFlows is a small **Mission Control** UI for watching completed agent runs. **Hermes** is the first adapter. A **Flow** is the observable replay of one completed agent run, and a **Step** is one visible action inside that replay: user prompt, tool call, tool result, or assistant response.

The app reads Hermes data locally and presents it as route-based views:

- **Mission Control** — the home dashboard
- **Adapter** — the integration layer that exposes a source of Flows
- **Hermes Profile** — a usable Hermes `state.db`
- **Flow** — the replay of one completed run
- **Step** — one visible event inside a Flow

## How it works

```
Hermes Agent (Telegram / CLI)
        │
        ▼ writes to local state.db
Hermes Profile
        │
        ▼ read-only access
AIFlows backend (Express + TypeScript)
        │
        ▼ JSON routes
AIFlows frontend (Vite + React)
```

AIFlows never writes to Hermes storage. It only reads existing profile databases.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Build the frontend
npm run build -w packages/frontend

# 3. Start the backend (serves API + built frontend)
HERMES_PROFILES_DIR=~/.hermes/profiles npm start

# 4. Open the app
open http://127.0.0.1:3417
```

## Development mode

```bash
# Terminal 1: backend
npm run dev:backend

# Terminal 2: frontend
npm run dev:frontend
```

Then open `http://127.0.0.1:5173`.

## Routes

- `/` — Mission Control home
- `/adapters/hermes` — Hermes profile selection
- `/adapters/hermes/profiles/:profileId` — recent Flows for one profile
- `/adapters/hermes/profiles/:profileId/flows/:flowId` — Flow replay

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3417` | Backend HTTP port |
| `HERMES_PROFILES_DIR` | `~/.hermes/profiles` | Hermes profiles directory |
| `VITE_API_URL` | `http://127.0.0.1:3417` | Backend URL used by Vite during development |

## Repository layout

```text
packages/
├── backend/
│   ├── src/
│   │   ├── app.ts           API routes + SPA fallback
│   │   ├── index.ts         server startup
│   │   ├── profiles.ts      Hermes profile discovery
│   │   ├── trace-reader.ts   SQLite → Flow normalisation
│   │   └── types.ts         backend data models
│   └── __tests__/
└── frontend/
    ├── src/
    │   ├── App.tsx                 route shell
    │   ├── api.ts                  fetch helpers
    │   ├── components/             Mission Control pages + replay UI
    │   └── style.css
    └── __tests__/
```

## Key decisions

- **Read-only** — AIFlows never writes to Hermes storage.
- **Adapter-first** — Hermes is the first adapter, but the UI is structured so more adapters can be added later.
- **Flow language** — visible UI uses Flow/Step language instead of Trace language.
- **Simple empty states** — the app prefers direct, low-noise empty/error messages.
- **No chain-of-thought wording** — the UI and docs describe observable actions only.

## Demo walkthrough

1. Start Hermes and make sure at least one profile has a usable `state.db`.
2. Start AIFlows.
3. Open Mission Control at `http://127.0.0.1:3417`.
4. Click **Hermes**.
5. Pick a Hermes profile.
6. Open a Flow.
7. Inspect the graph, timeline, and selected Step details.

## Verification

```bash
npm run typecheck
npm test
npm run build
```

## Empty states

The app keeps empty states plain and readable.

Examples:

- **No Hermes profiles** — `No Hermes data yet` / `No Hermes profiles found`
- **No Flows** — `No Flows yet. Send a prompt to Hermes, then refresh.`
- **Unknown route** — `Route not found`

## Out of scope

- Running or controlling Hermes from AIFlows
- Authentication
- WebSocket / SSE streaming
- Remote Hermes connections
- Editable workflows
- Chain-of-thought visualisation
