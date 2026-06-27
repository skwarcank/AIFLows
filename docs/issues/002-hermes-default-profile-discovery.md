# Issue 002: Make Hermes profile discovery include the default setup

## Goal

Ensure users who have not created named Hermes profiles can still use AIFlows through a default Hermes profile/setup entry.

## Product context

Many people run one Hermes agent/default setup and do not think in terms of named profiles. AIFlows must not show an empty Hermes Profiles page just because there are no custom profiles.

## Scope

Improve Hermes profile discovery so it returns usable Hermes profiles, including a default profile/setup when appropriate.

## Out of scope

- Settings UI for configuring Hermes path.
- Manual profile path selection.
- Remote connector behavior.

## UX/design notes

The Hermes Profiles page will show profile cards with profile name only. If only the default setup exists, the page should show a simple default profile card.

Suggested display label can be implementation-discretion, e.g. `default` or `Default Hermes`, but keep URLs readable.

## Implementation notes

Inspect current profile discovery behavior and Hermes storage assumptions. Preserve read-only access to Hermes data.

The adapter API should return enough information for the UI to route to the profile and list Flows.

## Acceptance criteria

- [ ] Named Hermes profiles still appear.
- [ ] A usable default Hermes setup appears when no named profiles exist but Hermes data is available.
- [ ] Profile cards can be rendered from adapter API data.
- [ ] No usable Hermes data produces a clear simple empty/error state payload.
- [ ] Tests cover named profile discovery and default setup discovery where practical.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
