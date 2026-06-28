# Issue 014: Maintain complete SaaS setup guide and env examples

## Goal

Ensure Krzysztof has exact external setup instructions for Supabase, GitHub, and Vercel.

## Product context

Krzysztof will do provider setup in browser. Amon must prepare repo artifacts and clear instructions, and pause for confirmation when external setup is required.

## Scope

- Maintain `docs/setup.md` as one complete checklist.
- Maintain `.env.example` files for app/connector as needed.
- Include Supabase Auth redirect URL warnings.
- Include GitHub OAuth setup instructions.
- Include Vercel Git integration instructions.
- Include migration application instructions.

## Out of scope

- Actually creating Supabase/GitHub/Vercel projects through automation.
- Storing real secrets.
- Applying production migrations automatically.

## UX/design notes

Instructions should be concrete enough for Krzysztof to follow without guessing. Use checklists.

## Implementation notes

Each issue that introduces new env vars or external provider requirements should update this file.

## Acceptance criteria

- [ ] `docs/setup.md` stays current.
- [ ] `.env.example` includes all required env vars with safe placeholders.
- [ ] Setup guide includes Supabase, GitHub OAuth, Vercel, migrations, and CI/CD instructions.
- [ ] Setup guide warns about localhost redirect misconfiguration.
- [ ] Amon pauses/asks for confirmation when an external step is needed.

## Verification

Run the relevant checks for the implemented workspace/package. At minimum, once scripts exist:

```bash
npm run typecheck
npm test
npm run build
```

If this issue requires external browser setup, update `docs/setup.md` and ask Krzysztof to confirm the step is complete before relying on it.
