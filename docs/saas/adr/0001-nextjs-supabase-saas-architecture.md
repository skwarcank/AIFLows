# ADR 0001: Use Next.js and Supabase for Hosted AIFlows

## Status

Accepted

## Context

AIFlows is pivoting from a local Express/Vite app toward a hosted SaaS product. The user is more familiar with Next.js and plans to use Supabase for the database. Hosted AIFlows needs authentication, default Workspaces, RLS-protected data, connector ingestion endpoints, and Vercel deployment.

## Decision

Build the SaaS version as a new Next.js app in the same repo, backed by Supabase Auth and Supabase Postgres.

Use Supabase Auth for email/password and GitHub OAuth. Use Supabase RLS from the start. Use Next.js API routes for Connector ingestion.

## Consequences

- Current Express/Vite app remains temporary reference, not permanent parallel product surface.
- SaaS app can deploy naturally through Vercel Git integration.
- Supabase setup requires careful redirect URL configuration so verification emails and OAuth do not point to localhost in production.
- Service-role writes must stay server-side only.
