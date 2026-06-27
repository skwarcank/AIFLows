export interface MissionProfile {
  id: string;
  externalId: string;
  name: string;
  profileType: string;
}

export interface MissionFlowStep {
  id: string;
  externalId: string | null;
  index: number;
  kind: string;
  title: string;
  description: string | null;
  toolName: string | null;
  metadata: Record<string, unknown>;
  occurredAt: string | null;
}

export interface MissionFlow {
  id: string;
  externalId: string;
  profileId: string | null;
  title: string;
  prompt: string;
  finalAnswer: string | null;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  source: string | null;
  model: string | null;
  steps: MissionFlowStep[];
}

export interface MissionControlData {
  profiles: MissionProfile[];
  flows: MissionFlow[];
}

export async function loadMissionControlData(supabase: any, integrationId: string): Promise<MissionControlData> {
  const { data: profiles, error: profileError } = await supabase
    .from('integration_profiles')
    .select('id, external_id, name, profile_type')
    .eq('integration_id', integrationId)
    .order('name');
  if (profileError) throw profileError;

  const { data: flows, error: flowError } = await supabase
    .from('flows')
    .select('id, external_id, integration_profile_id, title, prompt, final_answer, status, started_at, finished_at, source, model')
    .eq('integration_id', integrationId)
    .order('finished_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100);
  if (flowError) throw flowError;

  const flowIds = (flows ?? []).map((flow: any) => flow.id);
  let steps: any[] = [];
  if (flowIds.length > 0) {
    const { data, error } = await supabase
      .from('steps')
      .select('id, flow_id, external_id, step_index, kind, title, description, tool_name, tool_metadata, occurred_at')
      .in('flow_id', flowIds)
      .order('step_index');
    if (error) throw error;
    steps = data ?? [];
  }

  const stepsByFlow = new Map<string, MissionFlowStep[]>();
  for (const step of steps) {
    const list = stepsByFlow.get(step.flow_id) ?? [];
    list.push({
      id: step.id,
      externalId: step.external_id,
      index: step.step_index,
      kind: step.kind,
      title: step.title,
      description: step.description,
      toolName: step.tool_name,
      metadata: step.tool_metadata ?? {},
      occurredAt: step.occurred_at,
    });
    stepsByFlow.set(step.flow_id, list);
  }

  return {
    profiles: (profiles ?? []).map((profile: any) => ({
      id: profile.id,
      externalId: profile.external_id,
      name: profile.name,
      profileType: profile.profile_type,
    })),
    flows: (flows ?? []).map((flow: any) => ({
      id: flow.id,
      externalId: flow.external_id,
      profileId: flow.integration_profile_id,
      title: flow.title,
      prompt: flow.prompt,
      finalAnswer: flow.final_answer,
      status: flow.status,
      startedAt: flow.started_at,
      finishedAt: flow.finished_at,
      source: flow.source,
      model: flow.model,
      steps: stepsByFlow.get(flow.id) ?? [],
    })),
  };
}
