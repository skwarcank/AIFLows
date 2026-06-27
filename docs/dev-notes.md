# AIFlows — Development Notes

## Project structure

```
├── packages/
│   ├── backend/      TypeScript + Express API server
│   └── frontend/     Vite + React + React Flow dashboard
├── scripts/          Original JavaScript tracer bullets (legacy)
│   ├── trace-reader.js        Ported to packages/backend/src/trace-reader.ts
│   ├── serve-latest-trace.js  Replaced by packages/backend/src/index.ts
│   └── read-latest-trace.js   CLI utility (kept for reference)
└── docs/
    ├── PRD.md        Product requirements
    ├── issues/       Implementation slices
    └── dev-notes.md  This file
```

## Backend

The TypeScript + Express backend at `packages/backend/` replaces the original
raw-Node.js `serve-latest-trace.js`. Key differences:

- TypeScript with `tsx` dev runner (no build step during development)
- Profile discovery — scans `~/.hermes/profiles/` for subdirectories with `state.db`
- Multi-trace support — returns all completed traces, not just the latest
- Three endpoints: profiles list, traces list per profile, single trace detail
- Configurable Hermes profiles directory via `HERMES_PROFILES_DIR` env var
- Uses `better-sqlite3` for SQLite (synchronous reads)

### Commands

```bash
npm run dev -w packages/backend    # Dev with hot reload
npm run build -w packages/backend  # TypeScript build
npm run test -w packages/backend   # Run tests
```

## Frontend

The Vite + React + TypeScript dashboard at `packages/frontend/` is the new UI
that replaces the old static HTML tracer bullet.

### Key components

- **ProfileSelector** — dropdown populated from `GET /api/profiles`
- **StatusIndicator** — shows watching/offline/idle state
- **TraceSidebar** — scrollable list of trace cards with polling
- **TraceCard** — source badge, prompt preview, relative timestamp
- **MainContent** — routing between placeholder/graph/error views
- **GraphView** — React Flow canvas rendering trace events as nodes/edges
- **DetailPanel** — full event content viewer with monospace formatting

### Commands

```bash
npm run dev -w packages/frontend    # Vite HMR dev server
npm run build -w packages/frontend  # Production build
```

## Running everything

### Production mode (single command)

```bash
npm run build -w packages/frontend
HERMES_PROFILES_DIR=~/.hermes/profiles npm start
# Open http://127.0.0.1:3417
```

### Development mode (two terminals)

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
# Open http://127.0.0.1:5173
```

## Testing

The most important seam is the Hermes storage parser / trace normalizer:

```
Hermes SQLite rows → normalized RunTrace
```

Tests live in `packages/backend/__tests__/`.

```bash
npm test
```

## Legacy tracer bullets

The original JavaScript files in `scripts/` are kept for reference but are no
longer the primary way to run the app. They use Node.js's experimental built-in
SQLite module (`--experimental-sqlite` flag) and the built-in `http` module.
