export interface Profile {
  id: string;
  label: string;
  status: "available" | "no-database";
}

export interface TraceSummary {
  id: string;
  profile: string;
  sessionId: string;
  source: string;
  status: string;
  startedAt: string;
  finishedAt: string;
  promptPreview: string;
  finalAnswerPreview: string;
  model?: string;
}

export interface TraceEvent {
  id: string;
  type:
    | "user_prompt"
    | "tool_call"
    | "tool_result"
    | "assistant_response"
    | "error";
  title: string;
  content?: string;
  timestamp?: string;
  toolName?: string;
  raw?: unknown;
}

export interface RunTrace {
  id: string;
  profile: string;
  sessionId: string;
  source: string;
  status: "completed";
  startedAt: string;
  finishedAt: string;
  promptPreview: string;
  finalAnswerPreview: string;
  model?: string;
  events: TraceEvent[];
}

export interface AdapterInfo {
  id: string;
  name: string;
  status: "available" | "unavailable";
  profileCount: number;
}

export interface HermesProfile {
  id: string;
  label: string;
  status: "available";
}

export interface FlowSummary {
  id: string;
  profileId: string;
  sessionId: string;
  source: string;
  status: "completed";
  startedAt: string;
  finishedAt: string;
  promptPreview: string;
  model: string;
  stepCount: number;
}

export interface FlowStep {
  id: string;
  type:
    | "user_prompt"
    | "tool_call"
    | "tool_result"
    | "assistant_response"
    | "error";
  title: string;
  summary: string;
  content?: string;
  timestamp?: string;
  toolName?: string;
  details?: Array<{ label: string; value: string }>;
  raw?: unknown;
}

export interface FlowDetail extends FlowSummary {
  steps: FlowStep[];
}
