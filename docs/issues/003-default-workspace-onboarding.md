# Issue 003: Create default Workspace and no-Integration onboarding

## Goal

After login, create/use a default Workspace and show guided onboarding when no Integration exists.

## Product context

The user-facing product is single-user initially, but the data model should support teams later through Workspaces.

## Scope

- Ensure each new user gets a default Workspace.
- Route authenticated users to onboarding if no Integrations exist.
- Show a simple guided screen to add Hermes Integration.

## Out of scope

- Multi-workspace switcher.
- Team invites.
- Billing.
- Full pairing implementation.

## UX/design notes

Onboarding should focus only on Hermes. Do not show coming-soon adapter distractions in SaaS onboarding.

## Implementation notes

Default Workspace creation can happen via server-side route/action, trigger, or first-login initialization. Keep RLS constraints in mind.

## Acceptance criteria

- [ ] New authenticated user has a default Workspace.
- [ ] User with no Integrations sees guided onboarding.
- [ ] Onboarding offers Hermes Integration only.
- [ ] User with an Integration sees Mission Control placeholder instead.
- [ ] Tests cover no-Integration routing where practical.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and ask Krzysztof to confirm the step is complete before relying on it.
