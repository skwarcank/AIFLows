# ADR 0004: Remove the historical local app from active source

## Status

Accepted

## Context

AIFlows originally had a local Express/Vite prototype that read Hermes `state.db` directly and displayed completed Flows. After the SaaS direction became active, keeping the local app beside the hosted Next.js app created confusion for humans and AI agents.

The current product is Hosted AIFlows: Next.js + Supabase + a local Connector CLI.

## Decision

Remove the historical local Express/Vite app from active source and keep only the durable concepts in current docs:

- Flow / Step language;
- Hermes Profile concept;
- read-only Hermes access;
- observable-only replay;
- graph/timeline/detail UI shape.

Use git history as the archive for old implementation details.

## Consequences

- Root scripts and workspaces only target active packages.
- README, development notes, and agent instructions are SaaS-first.
- Future agents should not improve or resurrect the old local app unless Krzysztof explicitly asks.
- If old behavior needs to be recovered, inspect git history before this cleanup rather than keeping stale code/docs in the active tree.
