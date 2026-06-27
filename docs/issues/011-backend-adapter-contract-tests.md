# Issue 011: Add backend adapter API contract tests

## Goal

Add backend tests for the adapter-shaped API and Hermes adapter behavior.

## Product context

The frontend will rely on adapter-shaped routes. The contract should be tested so future changes do not break Mission Control navigation.

## Scope

Add tests for:

- adapter list;
- Hermes profiles list;
- Flow list with pagination;
- Flow detail;
- error response shape for unknown profile/Flow;
- existing Hermes trace normalization behavior.

## Out of scope

- Testing real user machines/profiles.
- Testing future adapters.
- End-to-end browser tests.

## UX/design notes

Errors should be clear JSON so the frontend can show simple empty/error states.

## Implementation notes

If current Express app setup makes route tests hard, consider extracting app creation from server listen startup so tests can call the app without binding a port.

Use fixtures or in-memory/test SQLite setup as appropriate. Keep tests focused on external API behavior.

## Acceptance criteria

- [ ] API contract tests exist for adapter list.
- [ ] API contract tests exist for Hermes profile list.
- [ ] API contract tests exist for Flow list pagination.
- [ ] API contract tests exist for Flow detail.
- [ ] Unknown profile/Flow errors are tested.
- [ ] Existing trace-reader tests remain passing.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
