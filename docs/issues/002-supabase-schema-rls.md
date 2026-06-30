# Issue 002: Add Supabase schema migrations and RLS policies

## Goal

Create Supabase migrations for the SaaS data model with RLS from the start.

## Product context

Hosted AIFlows stores private user agent activity. Workspace isolation must be enforced at the database layer.

## Scope

Add migrations for conceptual entities:

- workspaces;
- workspace_members;
- integrations;
- integration_profiles;
- flows;
- steps;
- pairing_tokens;
- connector_tokens or connector credential records.

Add RLS policies so users only access rows in their Workspace.

## Out of scope

- Automated production migration application.
- Billing tables.
- Multi-workspace UI.

## UX/design notes

UX remains single-user for now, but every user should have a default Workspace internally.

## Implementation notes

Include constraints for stable external IDs/upserts. Consider uniqueness for Integration/profile/Flow external IDs. Connector tokens and pairing tokens should be stored hashed, not plaintext.

## Acceptance criteria

- [ ] `supabase/migrations/` contains schema migration(s).
- [ ] Tables support Workspace → Integration → Profile → Flow → Step.
- [ ] RLS is enabled for user-facing tables.
- [ ] Policies prevent cross-workspace reads/writes.
- [ ] Pairing/connector token storage supports hashed tokens.
- [ ] Flow retention/latest-100 implementation is planned or scaffolded.
- [ ] `docs/setup.md` explains how migrations are applied manually.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and require confirmation the step is complete before relying on it.
