# Issue 004: Implement Hermes Integration creation and pairing token page

## Goal

Allow a user to create a pending Hermes Integration and receive a one-command Connector pairing command.

## Product context

This is the SaaS equivalent of “connect Hermes.” The user should not need to self-host AIFlows; they run a lightweight Connector near Hermes.

## Scope

- Create Hermes Integration record in pending state.
- Generate short-lived one-time pairing token.
- Store token hashed.
- Show command:
  `npx aiflows-connector connect --token <token>`
- Explain that the command runs on the same machine/VPS as Hermes.
- Poll Integration status after showing command.

## Out of scope

- Connector CLI implementation.
- Full Flow ingestion.
- Background service instructions.

## UX/design notes

Pairing page should show command + short explanation, not a giant troubleshooting page.

## Implementation notes

Pairing token should be scoped to one Integration and expire. Decide exact expiration pragmatically. Update setup docs if external env/settings are required.

## Acceptance criteria

- [ ] User can create a pending Hermes Integration.
- [ ] Pairing token is shown once in a connector command.
- [ ] Pairing token is stored hashed server-side.
- [ ] Pairing token has expiry/one-time semantics.
- [ ] UI polls Integration status.
- [ ] Setup docs explain pairing flow.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and require confirmation the step is complete before relying on it.
