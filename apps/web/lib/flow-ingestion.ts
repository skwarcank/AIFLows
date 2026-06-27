import type { FlowIngestionRequest, ShallowFlowPayload } from '@aiflows/flow-core';

export async function ingestFlows(supabase: any, context: { workspaceId: string; integrationId: string }, payload: FlowIngestionRequest): Promise<{ accepted: number }> {
  let accepted = 0;
  for (const flow of payload.flows) {
    await ingestOneFlow(supabase, context, flow);
    accepted += 1;
  }
  await enforceLatest100Retention(supabase, context.integrationId);
  await supabase.from('integrations').update({ status: 'syncing', last_synced_at: new Date().toISOString(), sync_error: null }).eq('id', context.integrationId);
  return { accepted };
}

async function ingestOneFlow(supabase: any, context: { workspaceId: string; integrationId: string }, flow: ShallowFlowPayload) {
  const { data: profile, error: profileError } = await supabase
    .from('integration_profiles')
    .upsert({
      workspace_id: context.workspaceId,
      integration_id: context.integrationId,
      external_id: flow.profile.externalId,
      name: flow.profile.name,
      profile_type: flow.profile.profileType ?? 'named',
    }, { onConflict: 'integration_id,external_id' })
    .select('id')
    .single();
  if (profileError) throw profileError;

  const { data: storedFlow, error: flowError } = await supabase
    .from('flows')
    .upsert({
      workspace_id: context.workspaceId,
      integration_id: context.integrationId,
      integration_profile_id: profile.id,
      external_id: flow.externalId,
      title: flow.title,
      prompt: flow.prompt,
      final_answer: flow.finalAnswer ?? null,
      status: flow.status,
      started_at: flow.startedAt ?? null,
      finished_at: flow.finishedAt ?? null,
      source: flow.source ?? null,
      model: flow.model ?? null,
    }, { onConflict: 'integration_id,external_id' })
    .select('id')
    .single();
  if (flowError) throw flowError;

  await supabase.from('steps').delete().eq('flow_id', storedFlow.id);
  if (flow.steps.length > 0) {
    const { error: stepsError } = await supabase.from('steps').insert(flow.steps.map((step) => ({
      workspace_id: context.workspaceId,
      flow_id: storedFlow.id,
      external_id: step.externalId,
      step_index: step.index,
      kind: step.kind,
      title: step.title,
      description: step.description ?? null,
      tool_name: step.toolName ?? null,
      tool_metadata: step.metadata ?? {},
      occurred_at: step.occurredAt ?? null,
    })));
    if (stepsError) throw stepsError;
  }
}

export async function enforceLatest100Retention(supabase: any, integrationId: string) {
  const { data, error } = await supabase
    .from('flows')
    .select('id')
    .eq('integration_id', integrationId)
    .order('finished_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  const stale = (data ?? []).slice(100).map((flow: { id: string }) => flow.id);
  if (stale.length > 0) {
    const { error: deleteError } = await supabase.from('flows').delete().in('id', stale);
    if (deleteError) throw deleteError;
  }
}
