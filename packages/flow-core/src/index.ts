export type FlowStepKind =
  | 'prompt'
  | 'final_answer'
  | 'tool_call'
  | 'tool_result'
  | 'error'
  | 'unknown';

export interface ShallowFlowStep {
  externalId: string;
  index: number;
  kind: FlowStepKind;
  title: string;
  description?: string;
  occurredAt?: string;
  toolName?: string;
  metadata?: Record<string, unknown>;
}

export interface ShallowFlowProfile {
  externalId: string;
  name: string;
  profileType?: 'default' | 'named' | string;
}

export interface ShallowFlowPayload {
  externalId: string;
  profile: ShallowFlowProfile;
  title: string;
  prompt: string;
  finalAnswer?: string;
  status: 'completed' | 'failed';
  startedAt?: string;
  finishedAt?: string;
  source?: string;
  model?: string;
  steps: ShallowFlowStep[];
}

export interface FlowIngestionRequest {
  flows: ShallowFlowPayload[];
}

export function normalizeStepKind(value: string | undefined): FlowStepKind {
  switch (value) {
    case 'user_prompt':
    case 'prompt':
      return 'prompt';
    case 'assistant_response':
    case 'final_answer':
      return 'final_answer';
    case 'tool_call':
      return 'tool_call';
    case 'tool_result':
      return 'tool_result';
    case 'error':
      return 'error';
    default:
      return 'unknown';
  }
}

export function truncateText(value: string | undefined, max = 2000): string | undefined {
  if (!value) return undefined;
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function validateFlowPayload(input: unknown): { ok: true; value: FlowIngestionRequest } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Payload must be an object.' };
  const flows = (input as { flows?: unknown }).flows;
  if (!Array.isArray(flows)) return { ok: false, error: 'Payload must include a flows array.' };
  if (flows.length === 0) return { ok: false, error: 'At least one flow is required.' };
  if (flows.length > 25) return { ok: false, error: 'At most 25 flows can be uploaded at once.' };

  for (const [index, flow] of flows.entries()) {
    if (!flow || typeof flow !== 'object') return { ok: false, error: `Flow ${index + 1} must be an object.` };
    const candidate = flow as Partial<ShallowFlowPayload>;
    if (!candidate.externalId || typeof candidate.externalId !== 'string') return { ok: false, error: `Flow ${index + 1} missing externalId.` };
    if (!candidate.profile?.externalId || !candidate.profile?.name) return { ok: false, error: `Flow ${index + 1} missing profile.` };
    if (!candidate.title || typeof candidate.title !== 'string') return { ok: false, error: `Flow ${index + 1} missing title.` };
    if (!candidate.prompt || typeof candidate.prompt !== 'string') return { ok: false, error: `Flow ${index + 1} missing prompt.` };
    if (candidate.status !== 'completed' && candidate.status !== 'failed') return { ok: false, error: `Flow ${index + 1} has invalid status.` };
    if (!Array.isArray(candidate.steps)) return { ok: false, error: `Flow ${index + 1} missing steps.` };
    for (const [stepIndex, step] of candidate.steps.entries()) {
      if (!step || typeof step !== 'object') return { ok: false, error: `Flow ${index + 1} step ${stepIndex + 1} must be an object.` };
      const s = step as Partial<ShallowFlowStep>;
      if (!s.externalId || typeof s.externalId !== 'string') return { ok: false, error: `Flow ${index + 1} step ${stepIndex + 1} missing externalId.` };
      if (typeof s.index !== 'number') return { ok: false, error: `Flow ${index + 1} step ${stepIndex + 1} missing index.` };
      if (!s.kind || !['prompt', 'final_answer', 'tool_call', 'tool_result', 'error', 'unknown'].includes(s.kind)) return { ok: false, error: `Flow ${index + 1} step ${stepIndex + 1} has invalid kind.` };
      if (!s.title || typeof s.title !== 'string') return { ok: false, error: `Flow ${index + 1} step ${stepIndex + 1} missing title.` };
    }
  }

  return { ok: true, value: input as FlowIngestionRequest };
}
