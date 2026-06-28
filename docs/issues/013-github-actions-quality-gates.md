# Issue 013: Add GitHub Actions quality gates and migration validation

## Goal

Add CI checks so the SaaS app can deploy through Vercel Git integration safely.

## Product context

Krzysztof will configure GitHub/Vercel externally. The repo should provide automated quality gates before deployment.

## Scope

- Add GitHub Actions workflow.
- Install dependencies.
- Run typecheck/test/build.
- Validate Supabase migrations if practical.
- Document required GitHub setup in `docs/setup.md`.

## Out of scope

- Deploying to Vercel from GitHub Actions.
- Applying production Supabase migrations automatically.
- Managing Vercel tokens.

## UX/design notes

CI failure messages should be clear for a beginner developer.

## Implementation notes

If migration validation requires Supabase CLI and becomes too heavy, implement best-effort validation and document the limitation.

## Acceptance criteria

- [ ] GitHub Actions workflow exists.
- [ ] Workflow runs typecheck/test/build.
- [ ] Workflow validates migrations if practical or documents why not.
- [ ] Workflow does not deploy to Vercel.
- [ ] Setup guide explains GitHub/Vercel integration steps.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and ask Krzysztof to confirm the step is complete before relying on it.
