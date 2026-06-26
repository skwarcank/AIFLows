export interface RunTrace {
  id: string;
  profile: string;
  sessionId: string;
  source: "telegram" | "cli" | "unknown" | string;
  status: "completed";
  startedAt: string;
  finishedAt: string;
  promptPreview: string;
  finalAnswerPreview: string;
  events: TraceEvent[];
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
