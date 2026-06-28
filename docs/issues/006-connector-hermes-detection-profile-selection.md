# Issue 006: Add Hermes detection and profile selection to Connector

## Goal

Let the Connector find Hermes data and ask which profiles to sync.

## Product context

Users should not need to know Hermes internals. But they should control which profiles are synced to Hosted AIFlows.

## Scope

- Auto-detect common Hermes paths.
- Support `--hermes-home` override.
- Discover Hermes profiles/default setup.
- Prompt user to choose profiles to sync.
- Save selected profiles in Connector local state.

## Out of scope

- Changing profiles from Hosted AIFlows UI.
- SSH-based remote Hermes access.
- Writing to Hermes.

## UX/design notes

Make it clear AIFlows reads Hermes read-only. If no Hermes data is found, explain `--hermes-home`.

## Implementation notes

Reuse/extract existing Hermes profile discovery logic where practical. Do not modify Hermes files.

## Acceptance criteria

- [ ] Connector auto-detects normal Hermes locations.
- [ ] `--hermes-home` override works.
- [ ] Named profiles and default setup can be discovered.
- [ ] User can choose profiles to sync.
- [ ] Selection persists in `~/.aiflows/connector.json`.
- [ ] Hermes storage remains read-only.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and ask Krzysztof to confirm the step is complete before relying on it.
