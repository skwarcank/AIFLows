# Issue 012: Polish product language, empty states, and README alignment

## Goal

Align the app and README with the updated Mission Control / Flow language.

## Product context

AIFlows should no longer present itself primarily as "Hermes Trace Visualizer." It is becoming Mission Control for agent Flows, with Hermes as the first adapter.

## Scope

Update user-facing language and docs:

- UI says Flow instead of Trace where visible to users.
- README explains Mission Control, Adapter, Hermes Profile, Flow, and Step.
- README keeps setup instructions accurate.
- Empty/loading/error states match the new route journey.
- Avoid chain-of-thought wording.

## Out of scope

- Full internal code rename.
- Marketing site copy.
- Screenshots/GIFs unless already convenient.
- Password/SaaS documentation beyond future-roadmap note.

## UX/design notes

Keep empty states simple. Example for no Flows:

```text
No Flows yet. Send a prompt to Hermes, then refresh.
```

Coming-soon adapters should be disabled/static.

## Implementation notes

Be careful not to update docs to describe features that are not implemented by this issue batch. README should match the app after issues are complete.

## Acceptance criteria

- [ ] Visible UI uses Flow language where appropriate.
- [ ] README defines Flow as an observable replay of one completed agent run.
- [ ] README identifies Hermes as the first adapter.
- [ ] README avoids saying AIFlows shows private thought process.
- [ ] Empty/loading/error states are simple and aligned with routes.
- [ ] Existing quick start remains accurate.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
