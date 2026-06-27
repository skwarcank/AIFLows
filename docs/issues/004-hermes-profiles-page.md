# Issue 004: Create Hermes Profiles route with simple profile cards

## Goal

Create the Hermes adapter page where users choose a Hermes profile before seeing Flows.

## Product context

The selected journey is explicit and simple: Adapter → Hermes Profile → Recent Flows → Flow Replay. The Hermes page should prioritize profile cards, not mixed Flow lists.

## Scope

Implement `/adapters/hermes`.

The page should:

- load Hermes profiles from the adapter API;
- render profile cards;
- show profile name only on each card;
- navigate to `/adapters/hermes/profiles/:profileId` when a profile is clicked;
- show a simple empty/error state if no usable Hermes profile exists.

## Out of scope

- Search/filter profiles.
- Profile descriptions/persona metadata.
- Recent Flows mixed across all profiles.
- Manual Hermes path configuration.

## UX/design notes

Keep this page intentionally simple. Profile cards should be easy to tap on mobile.

If only the default Hermes setup exists, it should still appear as a normal profile card.

## Implementation notes

Use readable URL-encoded profile IDs/names in routes. Ensure direct refresh of `/adapters/hermes` works.

## Acceptance criteria

- [ ] `/adapters/hermes` loads and displays Hermes Profiles.
- [ ] Each card shows profile name only.
- [ ] Clicking a profile navigates to the profile Flows route.
- [ ] Default Hermes setup appears when available.
- [ ] Empty/error states are simple and understandable.
- [ ] Frontend route test covers the page with mocked API data where practical.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
