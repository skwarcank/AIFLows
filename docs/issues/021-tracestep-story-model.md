# Issue 021: Introduce TraceStep story model for Flow Replay

## Goal

Create a presentation-level `TraceStep` model that turns stored shallow Flow `Step`s into a readable execution story for Flow Replay, without uploading or inventing deeper data.

## Product context

AIFlows should be Mission Control for watching AI agents work, not a raw debugging console. The current graph is interesting but too close to raw event data. This slice creates the interpretation layer needed for a user-friendly graph while preserving technical honesty.

Important vocabulary:

- `Step` = stored shallow observable event from connector/ingestion.
- `TraceStep` = UI/story interpretation of one or more stored `Step`s for Flow Replay.

A `TraceStep` must be generated from real stored Flow data. It must not claim access to private chain-of-thought and must not depend on an LLM summary in this first version.

## Scope

- Add a `TraceStep` type/model in the web/flow replay layer.
- Build a deterministic, rule-based interpreter from stored Flow `Step`s to `TraceStep`s.
- Support generic, non-coding-first categories:
  - Conversation
  - Planning
  - Context gathering
  - Analysis
  - Tool action
  - Artifact creation/editing
  - Verification
  - Error/recovery
  - Final result
- Preserve references from each `TraceStep` back to the source `Step` ids.
- Include at least these fields or equivalents:
  - id
  - kind/category
  - title
  - short summary/explanation
  - status
  - event/source step count
  - source step ids
  - optional children/grouping metadata
- Use heuristic labels based on available step/tool metadata, not LLM-generated summaries.
- Add fixture or test coverage showing raw stored Steps becoming readable TraceSteps.
- Update project vocabulary docs if there is an obvious glossary location for `TraceStep`.

## Out of scope

- Fullscreen graph UI.
- Inline group expansion.
- LLM-generated summaries.
- Uploading raw Hermes database rows or full raw tool outputs.
- Tool-specific evidence cards.
- Changing connector sync detail level unless strictly required by existing shallow data gaps.

## UX/design notes

The first visible result can be simple, but the model should already support the eventual graph language:

```text
Raw stored Steps
→ TraceSteps
→ compact graph nodes
→ expandable evidence/details
```

Use domain-specific titles when possible, while keeping generic categories stable.

Examples:

- Category: Context gathering; Title: `Inspected codebase`
- Category: Context gathering; Title: `Reviewed document`
- Category: Artifact creation/editing; Title: `Drafted reply`
- Category: Verification; Title: `Checked result`

Do not overfit this model to programming-only conversations. Coding traces are one domain, not the whole product.

## Implementation notes / likely seams

- Start near the existing Flow Replay transformation/rendering seam rather than modifying ingestion first.
- Keep the interpreter pure and testable: input stored Flow/Steps, output TraceSteps.
- Prefer small mapping tables for known tool names/categories.
- Group only obvious repeated events in this slice if safe; complex expansion behavior belongs to a later issue.
- Make errors/status explicit so later graph nodes can surface failures even when groups are collapsed.

the implementation agent process reminders:

- Read `CONTEXT.md`, `docs/PRD.md`, `docs/architecture.md`, `docs/setup.md`, and relevant ADRs before implementation.
- Preserve SaaS decisions and the shallow Step content policy.
- Use OpenCode deliberately for bounded implementation/review if available, but inspect and verify changes yourself.
- Run real verification before reporting success.
- Pause for external setup confirmation if external Supabase/GitHub/Vercel setup becomes necessary.

## Acceptance criteria

- [ ] Flow Replay has a typed `TraceStep` story model distinct from stored `Step`s.
- [ ] A deterministic interpreter maps stored shallow Steps into TraceSteps.
- [ ] TraceSteps include category, title, status, source step count, and source step references.
- [ ] The category system is generic enough for non-coding traces.
- [ ] Error/failure status can be represented for later graph rendering.
- [ ] Tests or fixtures demonstrate at least one coding trace and one non-coding-shaped trace.
- [ ] No private chain-of-thought, raw Hermes DB rows, or full raw tool outputs are introduced.

## Blocked by

None - can start immediately.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum:

```bash
npm run typecheck
npm test
npm run build
```

Also manually inspect a seeded or mocked Flow Replay and confirm generated TraceSteps are readable and source-linked.
