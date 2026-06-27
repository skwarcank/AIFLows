# Issue 006: Create routed Flow Replay with prompt header and clean linear graph

## Goal

Create the routed Flow Replay page for one completed Flow with a prompt-first header and clean linear graph.

## Product context

Flow Replay is the core product moment: a user opens a Flow and sees a visual replay of what the agent did. The graph should be truthful, linear, and minimal.

## Scope

Implement `/adapters/hermes/profiles/:profileId/flows/:flowId`.

The page should:

- load one Flow by profile and Flow ID;
- show the original prompt prominently as the header/title;
- render a chronological linear graph of Steps;
- use minimal node labels;
- visually distinguish Step types;
- avoid stale graph state when switching Flows.

## Out of scope

- Branching/grouped graph layouts.
- Rich text previews inside graph nodes.
- Raw data inspector.
- Diffs.
- Live/running state.

## UX/design notes

Graph = structure and sequence. Inspector = details.

Graph nodes should communicate type/title, not full content. Keep the canvas clean.

## Implementation notes

Fix any existing React Flow state issue where nodes/edges do not update after selected Flow changes. Route/deep-link loading must work.

Step types should have distinct visuals for at least:

- user prompt;
- tool call;
- tool result;
- assistant response;
- error;
- unknown fallback.

## Acceptance criteria

- [ ] Directly opening a Flow route loads the correct Flow.
- [ ] Header prioritizes the Flow prompt.
- [ ] Graph nodes/edges update correctly when navigating between Flows.
- [ ] Graph is chronological and linear.
- [ ] Nodes are minimal and visually distinct by Step type.
- [ ] No stale selected Step remains after Flow switch.
- [ ] Frontend test covers direct route/render where practical.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
