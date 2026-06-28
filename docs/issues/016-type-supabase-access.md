# Issue 016: Type Supabase access in the active SaaS app

## Goal

Reduce unsafe `any` usage around Supabase reads/writes so database-facing code is easier for agents and developers to change confidently.

## Product context

Hosted AIFlows relies on Supabase for Workspaces, Integrations, Connector auth, Flow ingestion, and Mission Control reads. These are security-sensitive seams. The current app works, but several functions accept `supabase: any` or map rows as `any`, weakening TypeScript's protection.

## Scope

- Identify active Supabase `any` usage in `apps/web`.
- Add a pragmatic typed database layer for the current schema.
- Prefer generated Supabase types if the workflow is already available; otherwise create local table row/insert/update interfaces that match current migrations.
- Replace broad `any` in core DB modules where practical:
  - `lib/mission-control.ts`
  - `lib/flow-ingestion.ts`
  - `lib/connector-auth.ts`
  - auth callback typing if safe
- Keep tests green.

## Out of scope

- Changing the database schema unless a type mismatch exposes a real bug.
- Large rewrite to an ORM.
- Changing RLS policy design.
- Refactoring UI components beyond what typing requires.

## Implementation notes

Be careful not to over-engineer. This is a safety cleanup, not a database abstraction project.

Useful approach:

1. Read `supabase/migrations/*.sql`.
2. Define or generate a `Database` type.
3. Use typed Supabase clients where possible.
4. Keep server-side service-role writes explicit and reviewable.

If generated Supabase types require external/project setup, update `docs/setup.md` and ask Krzysztof to confirm before relying on that path. A local handwritten type file is acceptable for this issue if it keeps the repo self-contained.

## Acceptance criteria

- [ ] Core Supabase modules no longer use broad `supabase: any` where a project type can reasonably be used.
- [ ] Row mapping in Mission Control is typed enough to catch missing/renamed fields.
- [ ] Ingestion and connector auth remain readable and explicit.
- [ ] No old local app packages are reintroduced.
- [ ] Tests/build pass.

## Verification commands

```bash
npm run typecheck
npm test
npm run build
```

## Blocked by

- Issue 015 is recommended first, so dependency changes do not conflict with typing changes.

## External setup rule

If this issue requires external Supabase CLI/project setup, update `docs/setup.md`, tell Krzysztof exactly what to do, and ask him to confirm before relying on that setup.
