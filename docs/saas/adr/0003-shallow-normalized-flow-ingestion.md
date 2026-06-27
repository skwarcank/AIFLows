# ADR 0003: Ingest shallow normalized Flows instead of raw Hermes data

## Status

Accepted

## Context

Hosted AIFlows should be a visual product for watching agents work, not a raw debugging console. Raw Hermes database rows and full tool outputs may contain sensitive content and large logs.

## Decision

The Connector normalizes Hermes activity locally and sends shallow Flow/Step payloads to Hosted AIFlows.

Hosted AIFlows stores:

- full user prompt;
- full final assistant answer;
- shallow Step descriptions and metadata;
- no raw Hermes database rows;
- no full raw tool outputs;
- no AI-generated summaries in v1.

Hosted retention keeps the latest 100 Flows per Integration.

## Consequences

- Better privacy and storage profile.
- Hosted backend is less Hermes-specific.
- Local Connector owns Hermes parsing and shallow payload generation.
- SaaS replay is less useful for deep debugging, intentionally.
