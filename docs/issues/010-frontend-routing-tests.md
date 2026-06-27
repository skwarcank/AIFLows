# Issue 010: Add frontend test setup and route/navigation coverage

## Goal

Add frontend tests that protect the routed Mission Control journey.

## Product context

This update adds real routes, deep links, and synchronized selection. AFK implementation will be safer if core navigation is tested.

## Scope

Add frontend test setup if missing, then cover the main route journey with mocked API data:

- Mission Control home;
- Hermes Profiles page;
- Profile Recent Flows page;
- Flow Replay route;
- deep-link route loading;
- selection sync if practical.

## Out of scope

- Exhaustive visual regression testing.
- Real Hermes database access in frontend tests.
- Browser E2E infrastructure unless already easy.

## UX/design notes

Tests should verify user-observable behavior, not implementation details.

## Implementation notes

Use a lightweight React testing setup appropriate for the existing Vite/React project. Update root `npm test` so frontend tests run along with backend tests, or provide a clear workspace test script integrated into CI-style verification.

Mock API responses at the fetch/module seam rather than requiring backend server.

## Acceptance criteria

- [ ] Frontend has a test command.
- [ ] Root `npm test` runs backend and frontend tests or clearly delegates both.
- [ ] Test covers `/` Mission Control rendering.
- [ ] Test covers navigation to Hermes Profiles.
- [ ] Test covers profile route rendering with mocked Flows.
- [ ] Test covers Flow Replay route/deep link with mocked Flow detail.
- [ ] Tests do not require real Hermes storage.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
