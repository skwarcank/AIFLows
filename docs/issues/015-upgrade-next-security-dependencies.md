# Issue 015: Upgrade Next.js security dependencies safely

## Goal

Remove the current production `npm audit --omit=dev` findings without breaking Hosted AIFlows.

## Product context

AIFlows is now SaaS-first. The active web app lives in `apps/web` and is deployed through Vercel Git integration. Current audit findings are tied to `next` / bundled `postcss`; `npm audit fix --force` proposes a breaking upgrade to Next 16, so this must be handled deliberately.

## Scope

- Inspect current Next.js and React dependency versions in the active workspace.
- Find the safest patched upgrade path, preferring a non-breaking/minimally-breaking Next.js version if available.
- Update package manifests and lockfile.
- Update code only where required by the framework upgrade.
- Verify auth routes, API routes, and build still work.
- Document any changed setup/deployment implications in `docs/dev-notes.md` or `docs/setup.md` if needed.

## Out of scope

- Large UI refactors.
- Supabase schema changes.
- Switching deployment away from Vercel Git integration.
- Running `npm audit fix --force` blindly without reviewing the framework jump.

## Implementation notes

Likely starting commands:

```bash
npm audit --omit=dev
npm view next versions --json
npm outdated
```

If a patched Next 14 or Next 15 version resolves the advisories, prefer that over jumping to Next 16. If only Next 16 resolves the audit, make the migration explicit and verify all affected Next APIs.

the implementation agent should use OpenCode for a focused review if available, especially to inspect Next migration impact.

## Acceptance criteria

- [ ] `npm audit --omit=dev` no longer reports the current Next/PostCSS production vulnerabilities, or the remaining advisory is explicitly documented with why it cannot be fixed safely yet.
- [ ] `package.json` and `package-lock.json` are updated consistently.
- [ ] No old local app packages are reintroduced.
- [ ] Hosted web routes still build successfully.
- [ ] Any required deployment/setup doc updates are made.

## Verification commands

```bash
npm install
npm audit --omit=dev
npm run typecheck
npm test
npm run build
```

## Blocked by

None - can start immediately.

## External setup rule

If this issue requires external Vercel/Supabase/GitHub changes, update `docs/setup.md`, document the required external steps, and require confirmation before relying on that setup.
