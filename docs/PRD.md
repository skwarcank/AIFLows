# PRD: AIFlows — Mission Control for Agent Flows

## Problem Statement

AIFlows currently works as a first Hermes trace visualizer, but the product still feels like a technical log viewer rather than **Mission Control for watching agents work**.

A user can run Hermes locally and inspect completed activity, but the journey is too flat: profile selection, trace list, graph, and detail inspection are all presented as one dashboard rather than a clear product experience. The app also still speaks mostly in "trace" language, which is accurate technically but does not express the larger direction: AIFlows should eventually watch multiple agent systems through adapters.

The immediate problem is not that AIFlows needs more raw features. The immediate problem is that it needs a stronger product structure:

1. AIFlows should feel like the first version of Mission Control, not just a trace viewer.
2. Hermes should become the first real adapter, not the entire product identity.
3. Users should move through a clear path: adapter → Hermes profile → recent Flows → Flow Replay.
4. The replay should be visual, truthful, and easy to understand on both desktop and mobile.
5. The architecture should make future adapters possible without building the full plugin/SaaS platform now.

## Solution

Upgrade AIFlows from a Hermes trace dashboard into an **adapter-first Mission Control experience**.

The first working adapter is Hermes. The user opens Mission Control, sees adapter bubbles/cards, chooses Hermes, chooses a Hermes profile, sees recent completed Flows for that profile, and opens a graph-forward Flow Replay.

A **Flow** is one completed observable Hermes turn: one user prompt through the final assistant response. A **Step** is one observable event inside that Flow: user prompt, tool call, tool result, error, or assistant response. AIFlows must stay truthful: it visualizes observable data from Hermes storage and must not claim to show private chain-of-thought.

The backend should expose adapter-shaped API routes with Hermes as the first adapter. The frontend should use real routes/deep links for the main product journey.

### North Star

> AIFlows feels like the first version of Mission Control, not just a trace viewer.

### Immediate Product Journey

```text
/ Mission Control
  ↓ click Hermes adapter
/adapters/hermes Hermes Profiles
  ↓ click profile
/adapters/hermes/profiles/:profileId Recent Flows
  ↓ click Flow
/adapters/hermes/profiles/:profileId/flows/:flowId Flow Replay
```

### Product Vocabulary

| Term | Meaning |
|---|---|
| Adapter | A type of agent system AIFlows can watch, e.g. Hermes. |
| Hermes Profile | A concrete Hermes profile/default setup discovered under the Hermes adapter. |
| Flow | One completed user prompt → final assistant answer. |
| Step | One observable event inside a Flow. |
| Flow Replay | The graph-forward replay view for a selected Flow. |
| Mission Control | The overall AIFlows experience for watching agent work. |

Internal code may keep existing `trace` names where a full rename would create churn. User-facing UI should use **Flow** language.

## User Stories

1. As a local AIFlows user, I want to open Mission Control, so that the app feels like a place to watch agent systems rather than a raw trace viewer.
2. As a local AIFlows user, I want to see Hermes as an active adapter bubble, so that I know AIFlows can currently watch Hermes.
3. As a local AIFlows user, I want to see future adapters as disabled coming-soon bubbles, so that I understand the platform direction without being misled into fake functionality.
4. As a Hermes user, I want to click the Hermes adapter, so that I can choose which Hermes profile to inspect.
5. As a Hermes user, I want the Hermes page to show profile cards, so that profile choice is explicit and simple.
6. As a Hermes user who only uses the default Hermes setup, I want AIFlows to show the default Hermes profile/setup as usable, so that I am not blocked by not having custom profiles.
7. As a Hermes user with named profiles, I want each discovered profile to appear by name, so that I can choose the correct agent/persona context.
8. As a Hermes user, I want to click a profile and see recent Flows for that profile, so that I inspect one agent context at a time.
9. As a Hermes user, I want the recent Flows list to show prompt preview, model, and timestamp, so that I can recognize a completed run quickly.
10. As a Hermes user, I want to see the latest 20 Flows first, so that the page stays fast and readable.
11. As a Hermes user, I want a Load more action, so that I can browse older Flows without search/filter complexity.
12. As a Hermes user, I want a simple empty state when no completed Flows exist, so that I know to send a prompt to Hermes and refresh.
13. As a Hermes user, I want to click a Flow and open a replay route, so that I can inspect a completed run in detail.
14. As a Hermes user, I want the Flow Replay header to prioritize the original prompt, so that the replay starts from the task I gave the agent.
15. As a Hermes user, I want the graph to be linear and chronological, so that it truthfully reflects observable execution order.
16. As a Hermes user, I want graph nodes to be minimal, so that the visual graph stays clean.
17. As a Hermes user, I want each Step type to look visually distinct, so that I can scan the Flow quickly.
18. As a Hermes user, I want clicking a graph node to update the inspector immediately, so that graph and details feel connected.
19. As a Hermes user, I want the right inspector to show timeline and selected Step detail together on desktop, so that I can keep context while inspecting a Step.
20. As a Hermes user, I want mobile Flow Replay to use tabs for Graph, Timeline, and Details, so that the app is usable on a phone.
21. As a Hermes user, I want Step details to be human-readable, so that I can understand what happened without reading raw JSON.
22. As a Hermes user, I want known tool calls to be summarized in friendly language, so that file, terminal, browser, memory, and skill activity is easy to follow.
23. As a Hermes user, I want file write/patch Steps to stay simple, so that AIFlows does not become a noisy diff/code-review tool too early.
24. As a Hermes user, I want deep links to work, so that refreshing or directly opening a profile/Flow URL loads the right view.
25. As a developer, I want backend routes to be adapter-shaped, so that Hermes is the first adapter and future adapters fit the same product model.
26. As a developer, I want the frontend to render static disabled coming-soon adapters, so that the backend remains honest and only exposes working adapters.
27. As a developer, I want frontend route/navigation tests, so that Mission Control pages do not regress.
28. As a developer, I want backend adapter/API contract tests, so that the frontend can rely on stable adapter-shaped responses.
29. As a future SaaS builder, I want the Flow model to stay independent from raw Hermes database rows, so that a future connector can send the same normalized shape.
30. As a reviewer, I want AIFlows to avoid chain-of-thought claims, so that the product is technically credible and truthful.

## Implementation Decisions

### Scope of this PRD

This PRD covers the next product update after the initial working version. It replaces the old v0 framing of "Hermes Trace Visualizer" with the next milestone: **adapter-first Mission Control with Hermes Flow Replay**.

It does not include self-hosted password protection, SaaS accounts, remote connectors, or live running Flows. Those are later milestones.

### Adapter-first architecture

Hermes should become the first concrete adapter.

The backend should introduce an adapter seam roughly equivalent to:

```text
Adapter → Hermes Profiles → Flows → Steps
```

The Hermes adapter is responsible for:

- discovering Hermes profiles, including the default Hermes setup when usable;
- listing completed Flows for a selected profile with pagination;
- returning one Flow with normalized Steps;
- hiding raw database details from the frontend.

Future adapters such as OpenCode, Claude Code, or Codex should not be implemented now, but the architecture should make them plausible later.

### Adapter-shaped API routes

The API should move from profile/trace-specific routes toward adapter-shaped routes.

Conceptual routes:

```text
GET /api/adapters
GET /api/adapters/hermes/profiles
GET /api/adapters/hermes/profiles/:profileId/flows?limit=20&offset=0
GET /api/adapters/hermes/profiles/:profileId/flows/:flowId
```

The backend should return real working adapters only. Coming-soon adapter cards are static frontend UI, not backend records.

Low-level response details are left to implementation discretion as long as they support the product behavior and are covered by tests.

### Mission Control routing

The frontend should use real routes/deep links:

```text
/
/adapters/hermes
/adapters/hermes/profiles/:profileId
/adapters/hermes/profiles/:profileId/flows/:flowId
```

Profile names can appear directly in URLs as readable URL-encoded values. Flow URLs can use generated technical IDs.

Refreshing or directly opening any route should load the corresponding page, assuming the backend data exists.

### Mission Control home

The home page shows adapter bubbles/cards:

- Hermes: active, loaded from backend adapter availability.
- OpenCode: static disabled coming soon.
- Claude Code: static disabled coming soon.
- Codex: static disabled coming soon.

Coming-soon cards should be visibly disabled and must not pretend to be functional.

### Hermes Profiles page

Clicking Hermes opens a Hermes Profiles page.

This page should prioritize profile cards. Each profile card shows the profile name only. Keep it simple.

If the user has no named profiles but has a usable default Hermes setup, AIFlows must show that default setup as a profile option rather than presenting an empty state.

### Recent Flows page

After selecting a profile, show recent completed Flows for that profile.

Flow cards show only:

- prompt preview;
- model;
- timestamp.

The page shows the latest 20 Flows initially and supports Load more. Search and filters are out of scope.

### Flow definition

For this PRD, one Flow is one completed Hermes user prompt through final assistant answer.

A Flow is not:

- an entire Hermes session;
- a task spanning multiple user messages;
- a fabricated reasoning chain;
- live token-by-token execution.

### Flow status

This PRD shows completed Flows only.

Error Steps can still appear inside a completed Flow Replay, but the recent Flow list does not need error badges or alternative Flow statuses now.

### Flow Replay layout

Desktop layout:

```text
Prompt/header
┌───────────────────────────────┬────────────────────┐
│ Visual graph                  │ Inspector          │
│                               │ Timeline           │
│                               │ Selected Step      │
└───────────────────────────────┴────────────────────┘
```

Mobile layout uses tabs:

```text
Prompt/header
[ Graph ] [ Timeline ] [ Details ]
```

Graph remains the primary visual object. Timeline and details support inspection.

### Graph behavior

The graph should be linear and chronological:

```text
Prompt → Tool Call → Tool Result → ... → Final Response
```

Graph nodes should be minimal: type/title only, not long previews. The inspector owns detail.

Each Step type should have distinct styling. Known first Step types include:

- user prompt;
- tool call;
- tool result;
- assistant response;
- error;
- unknown/other fallback.

Tool categories may get additional icon/color treatment when it is truthful and based on observable tool names.

### Inspector behavior

Desktop inspector shows timeline and selected Step detail together.

Clicking a graph node selects the Step and updates the inspector immediately. Clicking a timeline item selects the same Step and updates graph selection. Switching Flow clears stale selection.

Step detail should be human-readable only for now. Do not show raw debug blobs by default.

### Friendly Step summaries

Known tool activity should be summarized simply in friendly language.

First friendly summary categories:

1. file reading/searching;
2. file writing/patching;
3. terminal commands;
4. browser actions;
5. memory/skills.

Examples:

```text
Read file
Path: /root/projects/AIFlows/README.md
Limit: 200 lines
```

```text
Ran command
Command: npm test
Working directory: /root/projects/AIFlows
```

Keep summaries simple. No diffs. No raw blobs. Unknown tools can fall back to a generic readable summary.

### Polling

Polling remains acceptable. This PRD does not require WebSockets/SSE or live running Flow detection.

### Mobile usability

Mobile is a first-class constraint. The app does not need to be perfect for complex graph navigation on a phone, but the user must be able to:

- open Mission Control;
- choose Hermes;
- choose a profile;
- browse Flows;
- open a Flow;
- switch between Graph, Timeline, and Details tabs.

## Testing Decisions

Testing should focus on external behavior and stable seams.

### Backend tests

Backend tests should cover the adapter seam and API contracts:

1. `GET /api/adapters` returns Hermes as a working adapter.
2. Hermes profile discovery includes named profiles.
3. Hermes profile discovery handles/defaults the default Hermes setup when usable.
4. Hermes Flow listing returns completed Flows for a selected profile.
5. Flow listing supports `limit` and `offset` for latest 20 + Load more.
6. Flow detail returns normalized Steps in chronological order.
7. Unknown profile and unknown Flow return clear JSON errors.
8. Existing trace-reader behavior remains covered for user/tool/final-answer sequences.

### Frontend tests

Frontend tests should be added for the new route/navigation behavior:

1. `/` renders Mission Control adapter cards.
2. Clicking Hermes navigates to Hermes Profiles.
3. Clicking a profile navigates to recent Flows for that profile.
4. Clicking a Flow navigates to Flow Replay.
5. Direct deep links render the correct route when mocked API data exists.
6. Flow Replay selection synchronizes graph/timeline/detail where practical.
7. Mobile/tab behavior is tested at least at component/state level if practical.

### Verification commands

Every implementation issue should end with:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should include opening the app, navigating through the routed Mission Control journey, and checking a real or mocked Hermes Flow Replay.

## Out of Scope

This PRD explicitly does not include:

- self-hosted password protection;
- full user accounts;
- SaaS signup/login;
- remote connector installation;
- hosted AIFlows ingestion API;
- live running Flows;
- WebSocket/SSE streaming;
- token-by-token streaming;
- showing private chain-of-thought;
- controlling or prompting Hermes from AIFlows;
- running agents from AIFlows;
- editable workflow graphs;
- graph branching/grouping beyond chronological order;
- search/filter for Flows;
- settings/configuration page;
- raw-data inspector;
- diffs for file patches;
- error badges in the recent Flow list;
- OpenCode/Claude Code/Codex adapters;
- full internal rename of all trace-related code unless low-risk.

## Future Roadmap Notes

Later self-hosted access milestone:

- optional instance password when configured;
- password gate before the app;
- UI and API protected;
- session remembered for about 7 days;
- logout button.

Later SaaS milestone:

- hosted AIFlows app;
- user accounts;
- local connector running near Hermes;
- connector pairing;
- secure Flow ingestion;
- source health and data retention controls.

Later observability features:

- live/running Flows;
- active source status;
- richer timing metrics;
- search/filter;
- raw-data advanced mode;
- additional adapters.

## Success Criteria

This PRD succeeds when:

1. AIFlows opens to a Mission Control home rather than a trace dashboard.
2. Hermes appears as the active adapter and future adapters appear as disabled coming-soon cards.
3. Clicking Hermes opens a Hermes Profiles page.
4. Clicking a profile opens recent completed Flows for that profile.
5. Recent Flows show prompt preview, model, and timestamp.
6. Recent Flows support latest 20 plus Load more.
7. Clicking a Flow opens a routed Flow Replay page.
8. Flow Replay shows a prompt-first header, clean linear graph, and right inspector on desktop.
9. Flow Replay uses Graph/Timeline/Details tabs on mobile.
10. Known tool activity is summarized in human-readable language.
11. Routes and deep links work.
12. Backend API is adapter-shaped with Hermes as the first adapter.
13. Backend and frontend tests cover the new seams.
14. The product feels like the first version of Mission Control, not just a trace viewer.
