import type { Profile, TraceSummary, RunTrace } from "./types";

export async function fetchProfiles(): Promise<Profile[]> {
  const res = await fetch("/api/profiles");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Failed to fetch profiles (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchTraces(profileId: string): Promise<TraceSummary[]> {
  const res = await fetch(`/api/profiles/${encodeURIComponent(profileId)}/traces`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.message || `Failed to fetch traces (HTTP ${res.status})`
    );
  }
  return res.json();
}

export async function fetchTrace(traceId: string): Promise<RunTrace> {
  const res = await fetch(`/api/traces/${encodeURIComponent(traceId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.message || `Failed to fetch trace (HTTP ${res.status})`
    );
  }
  return res.json();
}

export async function fetchHealth(): Promise<boolean> {
  const res = await fetch("/health");
  if (!res.ok) return false;
  const body = await res.json();
  return body.ok === true;
}
