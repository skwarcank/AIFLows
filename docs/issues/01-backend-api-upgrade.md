# Backend API upgrade — configurable profiles & multi-trace (TypeScript + Express)

## Parent

PRD: `docs/PRD.md` — Phases 2-3 remainder. The existing tracer-bullet HTTP server (`scripts/serve-latest-trace.js`) proves the backend concept in raw Node.js/JavaScript. This issue rewrites it as a proper TypeScript + Express backend with profile discovery and multi-trace support.

## What to build

A TypeScript + Express backend that replaces the existing `serve-latest-trace.js`. It must:

1. Accept a configurable Hermes profiles directory (environment variable, defaulting to a sensible path like `~/.hermes`).
2. Discover Hermes profiles by scanning the profiles directory for subdirectories containing a `state.db` file.
3. Serve profile listing, recent-traces listing, and single-trace detail as JSON endpoints.
4. Keep the same normalized `RunTrace` / `TraceEvent` model from `trace-reader.js` (ported to TypeScript).
5. Return real data from Hermes SQLite storage — no static mocks.
6. Handle errors gracefully: missing profile directory, missing database, no completed traces. Return meaningful JSON error responses, not crash.
7. Replace the existing Node.js `http` server with Express. Use `tsx` as a dev runner (no build step needed during development).
8. Keep the existing static HTML UI working at `GET /` for backward compatibility until the React frontend is ready.
9. Use `better-sqlite3` for SQLite access (per PRD), with sync reads. If native build issues arise, fall back to `node:sqlite` (already proven in the tracer bullet).

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | `{ ok: true }` |
| GET | `/api/profiles` | List available profiles (each with id, label maybe, status) |
| GET | `/api/profiles/:id/traces` | List recent completed traces for a profile |
| GET | `/api/traces/:traceId` | Get a single trace with normalized events |

The profile's id should be a URL-safe slug (e.g. directory name). The backend should read the profile's `state.db` read-only on each request.

### Data model (unchanged from PRD)

Keep the same `RunTrace` and `TraceEvent` shapes defined in `docs/PRD.md:141-168`. Port them to TypeScript interfaces.

### What not to build

- No WebSockets or SSE (polling comes in Slice 2)
- No React yet (comes in Slice 2)
- No authentication
- No writes to Hermes storage
- No remote Hermes connections
- No profile creation

## Acceptance criteria

- [ ] `packages/backend/` exists with TypeScript + Express setup, runnable via `npm run dev` (or equivalent script command)
- [ ] `GET /api/profiles` returns a JSON list of discovered profiles
- [ ] `GET /api/profiles/:id/traces` returns recent completed traces with preview fields (id, source, promptPreview, finalAnswerPreview, startedAt, finishedAt)
- [ ] `GET /api/traces/:traceId` returns the full normalized trace including all events
- [ ] A trace with tool calls includes `tool_call` and `tool_result` events in correct order
- [ ] A trace without tool calls includes only `user_prompt` and `assistant_response` events
- [ ] Missing/unknown profiles return a 404 JSON error
- [ ] Missing Hermes data directory returns a friendly error, not a crash
- [ ] Porting preserves the same event-building logic from `scripts/trace-reader.js` (malformed tool-call JSON becomes `error` events, etc.)
- [ ] The Hermes profiles directory is configurable via environment variable (e.g. `HERMES_PROFILES_DIR`)
- [ ] `curl` or browser can retrieve all endpoints and verify real Hermes data

## Blocked by

None — can start immediately. The existing `scripts/trace-reader.js` and `scripts/serve-latest-trace.js` serve as reference implementations.
