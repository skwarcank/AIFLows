# AIFlows SaaS Setup Guide

This guide is for Krzysztof. Amon should keep it updated while implementing SaaS issues.

Important workflow rule:

> If an implementation issue requires an external browser/provider step, Amon must update this file with exact instructions and ask Krzysztof to confirm completion before relying on that step.

## 0. Local app to run while developing

- The new SaaS web app lives at `apps/web`.
- From the repo root, run:

```bash
npm run dev:web
```

- The app uses Next.js on `http://localhost:3000` by default.

## 1. Supabase project

Status: to be completed by Krzysztof in browser.

Steps:

1. Create a Supabase project for AIFlows SaaS.
2. Copy the project URL and anon / publishable key into `apps/web/.env.local` using `apps/web/.env.local.example` as the template.
3. Keep the service role key private; do not paste it into browser-facing code.
4. Apply migrations with the Supabase CLI wrapper in this repo.
5. Confirm the database tables and RLS policies exist before trying browser sign-in.

### Automated migration flow

Use the repo wrapper from the project root:

```bash
cp supabase/.env.local.example supabase/.env.local
# paste the remote Supabase database URL into SUPABASE_DB_URL
npm run supabase:push
```

For a dry run first:

```bash
npm run supabase:push:dry-run
```

### Manual migration fallback

If the CLI is unavailable, you can still apply `supabase/migrations/*.sql` by pasting them into **Supabase Dashboard → SQL Editor** in timestamp order.

## 2. Supabase Auth

Status: to be completed by Krzysztof in browser.

Enable email/password auth first.

### Supabase dashboard steps

1. Open **Authentication → Providers → Email**.
2. Turn on email/password sign-in.
3. Keep email verification enabled unless you have a reason to change it.
4. Open **Authentication → URL Configuration**.
5. Set the **Site URL** for local dev to:

```text
http://localhost:3000
```

6. Add these **Additional Redirect URLs**:

```text
http://localhost:3000/auth/callback
https://<your-vercel-domain>/auth/callback
```

7. Do **not** leave production verification/OAuth redirects pointing at localhost.

### GitHub OAuth in Supabase

1. Open **Authentication → Providers → GitHub**.
2. Enable the provider.
3. Create or reuse a GitHub OAuth App if Supabase asks for a client ID/secret.
4. Copy the **GitHub OAuth callback URL** shown in Supabase into the GitHub OAuth App settings.
5. Paste the GitHub client ID and secret back into Supabase.
6. Keep the redirect URL configured to the deployed Vercel domain once production is live.

If Supabase shows a callback like `https://<project-ref>.supabase.co/auth/v1/callback`, use that exact URL in GitHub.

## 3. Environment variables

Amon should maintain `apps/web/.env.local.example` with all required variables for the web app shell.

The Supabase CLI wrapper uses `supabase/.env.local.example` for remote migration settings.

Required for the web app shell:

Create the file in the Next.js app root:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Then fill it like this:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Important: `apps/web` is the Next.js project root, so this app reads env vars from `apps/web/.env.local` (not the repo root `.env`).

Keep this guide and `apps/web/.env.local.example` synchronized.

## 4. GitHub repository and Actions

Status: to be completed by Krzysztof in browser when repo is ready.

Amon should provide GitHub Actions workflow files that run quality gates:

- install dependencies;
- typecheck;
- tests;
- build;
- Supabase migration validation if practical.

No production database migrations should be auto-applied by GitHub Actions in the first version.

## 5. Vercel deployment

Deployment strategy:

> Vercel Git integration handles deployment. GitHub Actions runs checks only.

Krzysztof steps:

1. Create/import the AIFlows GitHub repo in Vercel.
2. Select the Next.js app root: `apps/web`.
3. Leave the build command as the Next.js default unless Amon later changes it.
4. Add the required environment variables in Vercel.
5. Configure the production domain/URL.
6. Update Supabase Auth redirect URLs to the deployed Vercel domain.
7. Trigger a deployment from Git.

## 6. Manual verification checklist

After the initial SaaS vertical slice:

- [ ] Sign up with email/password.
- [ ] Verify the email redirect opens the deployed app, not localhost.
- [ ] Sign in with GitHub OAuth.
- [ ] Confirm the user lands in the authenticated app shell.
- [ ] Confirm unauthenticated users are redirected to `/login`.
- [ ] Create a Hermes Integration from the onboarding screen.
- [ ] Copy the `npx aiflows-connector connect --token <token>` command.
- [ ] Run that command on the same machine/VPS as Hermes.
- [ ] Confirm the pairing screen starts polling integration status.

## 7. Hermes pairing flow

Status: implemented in the app; connector execution still requires Krzysztof on the Hermes machine.

What the app now does:

1. Creates a pending Hermes Integration in Supabase.
2. Generates a short-lived one-time pairing token.
3. Stores only the token hash server-side.
4. Shows the command:

```bash
npx aiflows-connector connect --token <token>
```

5. Polls the integration status after the command is shown.

Krzysztof step:

- Run the command on the same machine or VPS where Hermes is installed.

## 8. Confirmation rule

When a step depends on Supabase, GitHub, or Vercel setup in the browser, Krzysztof must confirm completion before Amon treats that setup as real.
