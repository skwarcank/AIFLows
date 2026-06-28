# Issue 008: Create shared Flow core and shallow payload model

## Goal

Define shared Flow/Step types for Hosted AIFlows shallow ingestion.

## Product context

Hosted AIFlows should store normalized shallow Flows, not raw Hermes rows or full tool outputs.

## Scope

- Create shared package for Flow/Step types.
- Define shallow Step payload fields.
- Include full prompt and final answer fields.
- Include tool Step descriptions/metadata only.
- Define stable external ID requirements.

## Out of scope

- AI-generated summaries.
- Full raw tool output storage.
- Deep debugging payloads.

## UX/design notes

The model should support graph/timeline/detail views with shallow descriptions.

## Implementation notes

This package should be usable by Connector and web app. Keep types practical; avoid over-abstract plugin framework.

## Acceptance criteria

- [ ] Shared Flow/Step type definitions exist.
- [ ] Types distinguish prompt/final answer/tool call/tool result/error/unknown.
- [ ] Types support shallow descriptions and metadata.
- [ ] External Flow/Step IDs are part of the model.
- [ ] No type requires raw Hermes DB rows.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and ask Krzysztof to confirm the step is complete before relying on it.
