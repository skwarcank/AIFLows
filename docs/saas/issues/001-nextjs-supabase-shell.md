# Issue 001: Create Next.js SaaS shell with Supabase Auth

## Goal

Create the new hosted AIFlows Next.js app shell with Supabase Auth wiring.

## Product context

Hosted AIFlows starts with a real login experience. Users should be able to sign up/log in and land in onboarding when they have no Integrations.

## Scope

- Create `apps/web` Next.js app.
- Add Supabase client/server auth wiring.
- Support email/password auth as primary path.
- Prepare GitHub OAuth route/callback support.
- Create authenticated app shell.
- Add unauthenticated redirect/login behavior.
- Add `.env.example` entries needed for the web app.

## Out of scope

- Full Integration onboarding.
- Connector pairing.
- Database schema beyond what is needed for auth shell unless issue 002 is done together.
- Billing/team UI.

## UX/design notes

If logged in and no Integration exists, show placeholder guided onboarding shell. Do not build full onboarding yet.

## Implementation notes

Use Supabase Auth rather than custom password storage. Be careful with production redirect URLs; update `docs/saas/setup.md` with exact Supabase Auth URL setup instructions.

## Acceptance criteria

- [ ] Next.js app exists under `apps/web`.
- [ ] User can sign up/log in locally with Supabase Auth when configured.
- [ ] GitHub OAuth callback route exists or is clearly prepared.
- [ ] Authenticated users see an app shell.
- [ ] Unauthenticated users cannot access protected app routes.
- [ ] `.env.example` contains required Supabase/app URL variables.
- [ ] `docs/saas/setup.md` includes exact external Supabase Auth setup instructions.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/saas/setup.md` and ask Krzysztof to confirm the step is complete before relying on it.
