# Issue 001: Introduce adapter-shaped Hermes API foundation

## Goal

Create the backend foundation for AIFlows as an adapter-first product, with Hermes as the first concrete adapter.

## Product context

AIFlows should feel like Mission Control for agent systems, not a one-off Hermes trace viewer. The backend should expose Hermes through adapter-shaped concepts so future adapters can fit the same model later.

## Scope

Build a working backend path for:

- listing working adapters;
- discovering Hermes profiles;
- listing completed Flows for one Hermes profile;
- retrieving one Flow for one Hermes profile.

Conceptual route shape:

```text
GET /api/adapters
GET /api/adapters/hermes/profiles
GET /api/adapters/hermes/profiles/:profileId/flows?limit=20&offset=0
GET /api/adapters/hermes/profiles/:profileId/flows/:flowId
```

Low-level payload details are up to implementation, but they must support the PRD journey and be consistent.

## Out of scope

- Implementing OpenCode/Claude/Codex adapters.
- Returning coming-soon adapters from the backend.
- Password protection.
- Live/running Flows.
- Full internal rename from trace to Flow.

## UX/design notes

The frontend will show static coming-soon adapter cards. The backend should only report real working adapters, initially Hermes.

## Implementation notes

Prefer introducing an adapter seam rather than pushing more Hermes-specific logic directly into route handlers. Existing trace-reader logic can remain underneath the Hermes adapter, but the API surface should speak in adapter/profile/Flow terms.

Expected adapter responsibilities:

- discover profiles;
- list flows for profile with pagination;
- get flow detail for profile;
- normalize raw Hermes rows into app-level Flow/Step shapes.

Keep old routes only if needed temporarily during migration, but new UI should use adapter-shaped routes.

## Acceptance criteria

- [ ] `GET /api/adapters` returns Hermes as a working adapter.
- [ ] `GET /api/adapters/hermes/profiles` returns Hermes profiles.
- [ ] `GET /api/adapters/hermes/profiles/:profileId/flows?limit=20&offset=0` returns completed Flow summaries.
- [ ] `GET /api/adapters/hermes/profiles/:profileId/flows/:flowId` returns one Flow with Steps.
- [ ] Unknown adapter/profile/Flow cases return clear JSON errors.
- [ ] The frontend does not need to know Hermes database details.
- [ ] Existing backend tests still pass.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
