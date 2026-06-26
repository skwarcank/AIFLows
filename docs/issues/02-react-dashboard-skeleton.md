# React dashboard skeleton with sidebar & polling

## Parent

PRD: `docs/PRD.md` — Phase 3 (React dashboard skeleton).

## What to build

A Vite + React + TypeScript frontend in `packages/frontend` that provides the dashboard shell. It connects to the backend API built in Slice 1. This is the first frontend slice that proves the full stack works: Hermes DB → TypeScript/Express API → React UI.

The dashboard must include:

1. **Profile selector** — a dropdown or list that calls `GET /api/profiles` on load and lets the user choose which Hermes profile to watch.
2. **Status indicator** — shows which profile is selected and whether the backend is reachable (poll `/health`).
3. **Trace sidebar** — lists recent traces fetched from `GET /api/profiles/:id/traces`. Each trace card shows source badge (telegram/cli/unknown), prompt preview (truncated), and timestamp. Clicking a trace selects it.
4. **Main content area** — shows a placeholder when no trace is selected (e.g. "Select a trace to view"). Will be replaced by the React Flow graph in Slice 3.
5. **Polling** — poll `GET /api/profiles/:id/traces` every ~2 seconds. When a new trace appears (or the list changes), update the sidebar automatically. This delivers the "live after answer" experience.
6. **Auto-refresh** — if a new trace appears that is newer than the currently selected trace, either auto-select it or show a visual indicator.

### Technical decisions

- Use Vite + React + TypeScript (per PRD).
- Keep dependencies minimal in this slice: only React, React DOM, maybe a lightweight CSS approach (CSS modules or plain CSS, not a component library yet).
- Use `fetch` directly (no React Query / SWR yet — polling is simple enough for v0).
- The profile selector data should persist across page refreshes (localStorage is fine for v0).
- The app should work when the backend is on a different port — use Vite proxy config to forward `/api/*` to the backend.

### What not to build

- No React Flow yet (comes in Slice 3)
- No node detail panel (comes in Slice 3)
- No fancy styling (comes in Slice 4)
- No authentication
- No WebSockets

## Acceptance criteria

- [ ] `packages/frontend/` exists with Vite + React + TypeScript, runnable via `npm run dev`
- [ ] Vite proxy forwards `/api/*` to the backend (configurable via env var, e.g. `VITE_API_URL`)
- [ ] Dashboard loads and shows a profile selector populated from `GET /api/profiles`
- [ ] Selecting a profile shows a status indicator ("Watching: profile-name")
- [ ] After selecting a profile, the sidebar populates with recent traces from the API
- [ ] Each trace card displays: source badge (colored label), prompt preview (truncated to ~120 chars), relative timestamp
- [ ] Clicking a trace card selects it (highlighted in sidebar) and shows placeholder content in the main area
- [ ] Polling every ~2 seconds detects new traces and updates the sidebar without page reload
- [ ] If the backend is unreachable, the status indicator shows an error state (not a blank/crashing page)
- [ ] If no profiles are found, the selector shows a friendly message
- [ ] Profile selection persists in localStorage across page refreshes

## Blocked by

- Slice 1 (needs `GET /api/profiles` and `GET /api/profiles/:id/traces` endpoints)
