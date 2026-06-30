# AIFlows SaaS Setup Guide

This guide covers local and external setup for AIFlows SaaS.

Important workflow rule:

> If an implementation issue requires an external browser/provider step, update this file with exact instructions and require confirmation before relying on that step.

## 0. Local app to run while developing

- The SaaS web app lives at `apps/web`.
- From the repo root, run:

```bash
npm run dev:web
```

- The app uses Next.js on `http://localhost:3000` by default.
- If using the Connector from another machine, set `NEXT_PUBLIC_APP_URL` to a URL reachable from that machine, not `localhost`.

## 1. Supabase project

Steps:

1. Create a Supabase project for AIFlows SaaS.
2. Copy the project URL and anon/publishable key into `apps/web/.env.local` using `apps/web/.env.local.example`.
3. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY` in `apps/web/.env.local`. Keep it private; never expose it in browser code.
4. Apply migrations with the Supabase CLI wrapper.
5. Confirm the database tables and RLS policies exist before browser sign-in.

### Automated migration flow

Use the repo wrapper from the project root:

```bash
cp supabase/.env.local.example supabase/.env.local
# paste the remote Supabase database URL into SUPABASE_DB_URL
npm run supabase:push:dry-run
npm run supabase:push
```

### Manual migration fallback

If the CLI is unavailable, apply `supabase/migrations/*.sql` in **Supabase Dashboard → SQL Editor** in timestamp order.

## 2. Supabase Auth

Enable email/password auth first.

### Supabase dashboard steps

1. Open **Authentication → Providers → Email**.
2. Turn on email/password sign-in.
3. Keep email verification enabled unless you intentionally disable it for local dev.
4. Open **Authentication → URL Configuration**.
5. Set local **Site URL** to:

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
4. Copy the Supabase callback URL into the GitHub OAuth App settings.
5. Paste the GitHub client ID and secret back into Supabase.
6. Use the deployed Vercel domain once production is live.

If Supabase shows a callback like `https://<project-ref>.supabase.co/auth/v1/callback`, use that exact URL in GitHub.

## 3. Environment variables

### Web app

Create the file in the Next.js app root:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Then fill it like this:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Important: `apps/web` is the Next.js project root, so this app reads env vars from `apps/web/.env.local`, not the repo root `.env`.

### Supabase CLI wrapper

```bash
cp supabase/.env.local.example supabase/.env.local
```

Fill:

```env
SUPABASE_DB_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

### Connector

The curl installer passes `--api-base-url` automatically. Optional local overrides live in:

```bash
cp packages/connector/.env.example packages/connector/.env
```

Use `HERMES_HOME=/path/to/.hermes` only if Hermes is not in a normal location.

## 4. GitHub repository and Actions

The repo includes `.github/workflows/quality-gates.yml`.

It runs:

- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run build`
- a lightweight Supabase migration sanity check

It does **not** deploy to Vercel and does **not** apply production migrations.

External setup steps:

1. Ensure GitHub auth is configured on the machine used to push.
2. Push `main` to GitHub.
3. Open the GitHub Actions tab and confirm the workflow passes.

## 5. Vercel deployment

Deployment strategy:

> Vercel Git integration handles deployment. GitHub Actions runs checks only.

External setup steps:

1. Create/import the AIFlows GitHub repo in Vercel.
2. Select the Next.js app root: `apps/web`.
3. Add the required environment variables from section 3.
4. Set `NEXT_PUBLIC_APP_URL` to the deployed Vercel URL.
5. Configure production domain/URL if available.
6. Update Supabase Auth redirect URLs to the deployed Vercel domain.
7. Trigger a deployment from Git.

## 6. Hermes pairing and Connector flow

What the app does:

1. Creates a pending Hermes Integration in Supabase.
2. Generates a short-lived one-time pairing token.
3. Stores only the token hash server-side.
4. Shows a curl command:

```bash
curl -fsSL <app-url>/api/connectors/install.sh | bash -s -- --token <token>
```

The install script downloads the connector from GitHub, builds it locally, and pairs it with Hosted AIFlows.

The installer launches the guided setup wizard:

```bash
aiflows-connector setup --token <token>
```

The wizard pairs with Hosted AIFlows, detects Hermes read-only, lets you choose profiles, asks whether to queue recent history, and offers to start watching immediately.

After setup, run the connector beside Hermes:

```bash
aiflows-connector run
```

If `~/.aiflows/bin` is not on `PATH`, the installer prints a short color-coded PATH warning, shows full-path commands that always work, then asks before editing your shell config and defaults to No. The always-working commands are:

```bash
~/.aiflows/bin/aiflows-connector tldr
~/.aiflows/bin/aiflows-connector help
~/.aiflows/bin/aiflows-connector run
```

The installer also creates a short alias at `~/.aiflows/bin/aiflows`, so this works once `~/.aiflows/bin` is on `PATH`:

```bash
aiflows tldr
```

Useful commands after `source ~/.bashrc` or a new terminal:

```bash
aiflows-connector tldr
aiflows-connector help
aiflows-connector status
aiflows-connector doctor
aiflows-connector profiles
aiflows-connector profiles add <profile> --recent 20
aiflows-connector profiles remove <profile>
aiflows-connector config
aiflows-connector detect --hermes-home /path/to/.hermes
aiflows-connector run --hermes-home /path/to/.hermes --once
```

Without PATH active yet, prefix commands with the full path:

```bash
~/.aiflows/bin/aiflows-connector status
~/.aiflows/bin/aiflows-connector run
```

The connector:

- discovers Hermes profiles read-only;
- lets you choose which detected profiles to sync;
- can queue recent completed history or watch only future Flows;
- shows local/server health through `status` and `doctor`;
- sends heartbeat status;
- uploads shallow completed Flow payloads every 5 seconds;
- exits clearly if the Integration is deleted or credentials are revoked.

## 7. Manual verification checklist

After the SaaS vertical slice:

- [ ] Apply migrations.
- [ ] Sign up with email/password.
- [ ] Verify auth redirect opens the correct app URL.
- [ ] Sign in with GitHub OAuth if configured.
- [ ] Confirm authenticated users land in `/app`.
- [ ] Confirm unauthenticated users redirect to `/login`.
- [ ] Create a Hermes Integration from onboarding.
- [ ] Copy the curl pairing command.
- [ ] Run that command on the same machine/VPS as Hermes.
- [ ] Run `aiflows-connector run`.
- [ ] Confirm status changes from pending to connected/syncing/offline as appropriate.
- [ ] Confirm synced Flows appear in Hosted Mission Control.
- [ ] Open a Flow Replay and verify prompt, timeline/tool summaries, and final answer render.
- [ ] Delete the Integration and confirm synced data disappears.
- [ ] Confirm a running connector exits clearly on next heartbeat/ingest after deletion.

## 8. Confirmation rule

When a step depends on Supabase, GitHub, or Vercel setup in the browser, require confirmation before treating that setup as available.
