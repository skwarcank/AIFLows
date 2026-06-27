import type {
  AdapterInfo,
  FlowDetail,
  FlowSummary,
  HermesProfile,
  Profile,
  RunTrace,
  TraceSummary,
} from "./types";

interface AdapterListResponse {
  adapters: AdapterInfo[];
}

interface HermesProfilesResponse {
  adapterId: string;
  profiles: HermesProfile[];
  emptyState?: {
    title: string;
    message: string;
  };
}

interface HermesFlowsResponse {
  adapterId: string;
  profileId: string;
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
  flows: FlowSummary[];
}

interface HermesFlowResponse {
  adapterId: string;
  profileId: string;
  flow: FlowDetail;
}

async function readJson<T>(res: Response, fallbackLabel: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `${fallbackLabel} (HTTP ${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchAdapters(): Promise<AdapterInfo[]> {
  const res = await fetch("/api/adapters");
  const body = await readJson<AdapterListResponse>(res, "Failed to fetch adapters");
  return body.adapters;
}

export async function fetchHermesProfiles(): Promise<HermesProfilesResponse> {
  const res = await fetch("/api/adapters/hermes/profiles");
  return readJson<HermesProfilesResponse>(res, "Failed to fetch Hermes profiles");
}

export async function fetchHermesFlows(
  profileId: string,
  limit = 20,
  offset = 0
): Promise<HermesFlowsResponse> {
  const res = await fetch(
    `/api/adapters/hermes/profiles/${encodeURIComponent(profileId)}/flows?limit=${limit}&offset=${offset}`
  );
  return readJson<HermesFlowsResponse>(res, "Failed to fetch Hermes flows");
}

export async function fetchHermesFlow(
  profileId: string,
  flowId: string
): Promise<HermesFlowResponse> {
  const res = await fetch(
    `/api/adapters/hermes/profiles/${encodeURIComponent(profileId)}/flows/${encodeURIComponent(flowId)}`
  );
  return readJson<HermesFlowResponse>(res, "Failed to fetch Hermes flow");
}

// Legacy helpers preserved for compatibility with the earlier Flow Explorer app.
export async function fetchProfiles(): Promise<Profile[]> {
  const res = await fetch("/api/profiles");
  return readJson<Profile[]>(res, "Failed to fetch profiles");
}

export async function fetchTraces(profileId: string): Promise<TraceSummary[]> {
  const res = await fetch(`/api/profiles/${encodeURIComponent(profileId)}/traces`);
  return readJson<TraceSummary[]>(res, "Failed to fetch traces");
}

export async function fetchTrace(traceId: string): Promise<RunTrace> {
  const res = await fetch(`/api/traces/${encodeURIComponent(traceId)}`);
  return readJson<RunTrace>(res, "Failed to fetch trace");
}

export async function fetchHealth(): Promise<boolean> {
  const res = await fetch("/health");
  if (!res.ok) return false;
  const body = (await res.json()) as { ok?: boolean };
  return body.ok === true;
}
