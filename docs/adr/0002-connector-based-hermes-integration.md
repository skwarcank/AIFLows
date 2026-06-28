# ADR 0002: Connect Hosted AIFlows to Hermes through a foreground Connector

## Status

Accepted

## Context

Hermes data lives locally on the user's machine/VPS. Hosted AIFlows cannot read local Hermes storage without a bridge. The product goal is no self-hosting, but some local command is necessary to connect Hermes.

## Decision

Use a separate Node/TypeScript AIFlows Connector CLI. The first version runs in the foreground on the same machine/VPS as Hermes.

The hosted app creates a Hermes Integration and one-time pairing token, then shows:

```bash
npx aiflows-connector connect --token <pairing-token>
```

The Connector pairs, stores local state under `~/.aiflows`, reads Hermes storage read-only, polls every 5 seconds, sends heartbeats, and pushes completed Flows over outbound HTTPS.

## Consequences

- Users do not expose inbound ports or Hermes databases.
- No background service management is needed in v1.
- Users must keep the foreground Connector running to sync Flows.
- Service installation, SSH-based remote reading, and Hermes plugin integration remain future work.
