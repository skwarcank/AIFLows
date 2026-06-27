# ADR 0004: Keep the current local app as temporary reference during SaaS migration

## Status

Accepted

## Context

The repo already contains a working Express/Vite local AIFlows version. The SaaS direction requires a Next.js/Supabase app and Connector. Keeping both apps forever would create confusion and maintenance drag.

## Decision

Create the SaaS app inside the same repo while using the current local app as temporary reference. Do not treat the old app as a permanent product surface unless explicitly decided later.

Once the SaaS vertical slice replaces the useful behavior, archive, remove, or clearly demote the old app.

## Consequences

- The repo can evolve without losing useful existing code/ideas.
- The migration must avoid becoming a junk drawer.
- Future issues should prefer shared packages for Flow types and Hermes parsing rather than duplicating logic.
