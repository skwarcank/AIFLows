# Issue 005: Create Node Connector CLI pairing and local state

## Goal

Create the first AIFlows Connector CLI that can pair with Hosted AIFlows and store local state.

## Product context

The Connector is the bridge between local Hermes and Hosted AIFlows. First version runs in foreground and pairs through a token command.

## Scope

- Create `packages/connector` Node/TypeScript CLI.
- Implement `connect --token <pairing-token>`.
- Exchange pairing token with Hosted AIFlows.
- Receive connector token.
- Store local state under `~/.aiflows/connector.json`.
- Print clear success/failure messages.

## Out of scope

- Service/background install.
- Hermes parsing.
- Flow ingestion beyond pairing.

## UX/design notes

CLI output should be beginner-friendly. If Integration was deleted/revoked, tell user to re-run connect.

## Implementation notes

Use an API base URL configurable via env/flag for local vs hosted testing.

## Acceptance criteria

- [ ] `npx`-style package/CLI structure exists.
- [ ] Connector can call pairing endpoint.
- [ ] Connector token is stored locally after success.
- [ ] Local state is under `~/.aiflows`.
- [ ] Failed pairing prints actionable error.
- [ ] Tests cover local state read/write where practical.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and require confirmation the step is complete before relying on it.
