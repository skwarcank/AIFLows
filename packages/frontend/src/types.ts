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
  events: TraceEvent[];
}
