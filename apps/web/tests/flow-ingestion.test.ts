import { describe, expect, it } from 'vitest';

import { enforceLatest100Retention, ingestFlows } from '../lib/flow-ingestion';
import { validateFlowPayload } from '../lib/flow-ingestion-schema';
import type { ShallowFlowPayload } from '../lib/flow-ingestion-schema';

interface FakeProfile { id: string; workspace_id: string; integration_id: string; external_id: string; name: string; profile_type: string }
interface FakeFlow { id: string; workspace_id: string; integration_id: string; integration_profile_id: string | null; external_id: string; title: string; prompt: string; final_answer: string | null; status: string; started_at: string | null; finished_at: string | null; source: string | null; model: string | null; created_at: string }
interface FakeStep { id: string; flow_id: string; workspace_id: string; step_index: number; external_id?: string | null }

class FakeSupabase {
  profiles: FakeProfile[] = [];
  flows: FakeFlow[] = [];
  steps: FakeStep[] = [];
  integrationUpdates: unknown[] = [];

  from(table: string) {
    return new FakeQuery(this, table);
  }
}

class FakeQuery {
  private filters: Record<string, unknown> = {};
  private inFilter: { column: string; values: unknown[] } | null = null;
  private mode: 'select' | 'upsert' | 'delete' | 'insert' | 'update' | null = null;
  private payload: unknown;

  constructor(private db: FakeSupabase, private table: string) {}

  select() { this.mode = this.mode ?? 'select'; return this; }
  order() { return this; }
  eq(column: string, value: unknown) { this.filters[column] = value; return this; }
  in(column: string, values: unknown[]) { this.inFilter = { column, values }; return this; }

  upsert(payload: unknown) { this.mode = 'upsert'; this.payload = payload; return this; }
  insert(payload: unknown) { this.mode = 'insert'; this.payload = payload; return this.then((value) => value); }
  update(payload: unknown) { this.mode = 'update'; this.payload = payload; return this; }
  delete() { this.mode = 'delete'; return this; }

  async single() {
    if (this.mode === 'upsert' && this.table === 'integration_profiles') {
      const payload = this.payload as Omit<FakeProfile, 'id'>;
      let profile = this.db.profiles.find((candidate) => candidate.integration_id === payload.integration_id && candidate.external_id === payload.external_id);
      if (!profile) {
        profile = { id: `profile-${this.db.profiles.length + 1}`, ...payload };
        this.db.profiles.push(profile);
      } else {
        Object.assign(profile, payload);
      }
      return { data: { id: profile.id }, error: null };
    }

    if (this.mode === 'upsert' && this.table === 'flows') {
      const payload = this.payload as Omit<FakeFlow, 'id' | 'created_at'>;
      let flow = this.db.flows.find((candidate) => candidate.integration_id === payload.integration_id && candidate.external_id === payload.external_id);
      if (!flow) {
        flow = { id: `flow-${this.db.flows.length + 1}`, created_at: String(this.db.flows.length + 1).padStart(3, '0'), ...payload };
        this.db.flows.push(flow);
      } else {
        Object.assign(flow, payload);
      }
      return { data: { id: flow.id }, error: null };
    }

    return { data: null, error: null };
  }

  async then(resolve: (value: { data?: unknown[] | null; error: null }) => unknown) {
    if (this.mode === 'insert' && this.table === 'steps') {
      const rows = this.payload as FakeStep[];
      this.db.steps.push(...rows.map((row, index) => ({ ...row, id: row.id ?? `step-${this.db.steps.length + index + 1}` })));
      return resolve({ error: null });
    }

    if (this.mode === 'delete' && this.table === 'steps') {
      this.db.steps = this.db.steps.filter((step) => step.flow_id !== this.filters.flow_id);
      return resolve({ error: null });
    }

    if (this.mode === 'delete' && this.table === 'flows') {
      const ids = new Set(this.inFilter?.values ?? []);
      this.db.flows = this.db.flows.filter((flow) => !ids.has(flow.id));
      this.db.steps = this.db.steps.filter((step) => this.db.flows.some((flow) => flow.id === step.flow_id));
      return resolve({ error: null });
    }

    if (this.mode === 'update' && this.table === 'integrations') {
      this.db.integrationUpdates.push(this.payload);
      return resolve({ error: null });
    }

    if (this.mode === 'select' && this.table === 'flows') {
      let rows = this.db.flows.filter((flow) => !this.filters.integration_id || flow.integration_id === this.filters.integration_id);
      rows = rows.sort((a, b) => (b.finished_at ?? b.created_at).localeCompare(a.finished_at ?? a.created_at));
      return resolve({ data: rows.map((flow) => ({ id: flow.id })), error: null });
    }

    return resolve({ error: null });
  }
}

function flowPayload(overrides: Partial<ShallowFlowPayload> = {}): ShallowFlowPayload {
  return {
    externalId: 'flow-1',
    profile: { externalId: 'profile-1', name: 'Default', profileType: 'named' },
    title: 'A completed flow',
    prompt: 'Do the thing',
    finalAnswer: 'Done',
    status: 'completed',
    finishedAt: '2026-06-27T12:00:00.000Z',
    steps: [{ externalId: 'step-1', index: 0, kind: 'prompt', title: 'Prompt' }],
    ...overrides,
  };
}

describe('flow ingestion security seams', () => {
  it('rejects invalid ingestion payloads before database writes', () => {
    expect(validateFlowPayload({ flows: [] })).toEqual({ ok: false, error: 'At least one flow is required.' });
    expect(validateFlowPayload({ flows: [{ externalId: 'flow-1' }] })).toEqual({ ok: false, error: 'Flow 1 missing profile.' });
  });

  it('upserts duplicate flows and replaces steps instead of creating duplicate flow rows', async () => {
    const supabase = new FakeSupabase();
    const context = { workspaceId: 'workspace-1', integrationId: 'integration-1' };

    await ingestFlows(supabase as never, context, { flows: [flowPayload()] });
    await ingestFlows(supabase as never, context, { flows: [flowPayload({ title: 'Updated title', steps: [{ externalId: 'step-2', index: 0, kind: 'final_answer', title: 'Answer' }] })] });

    expect(supabase.flows).toHaveLength(1);
    expect(supabase.flows[0].title).toBe('Updated title');
    expect(supabase.steps).toHaveLength(1);
    expect(supabase.steps[0].external_id).toBe('step-2');
  });

  it('keeps only the latest 100 flows per integration', async () => {
    const supabase = new FakeSupabase();
    for (let index = 0; index < 105; index += 1) {
      supabase.flows.push({
        id: `flow-${index}`,
        workspace_id: 'workspace-1',
        integration_id: 'integration-1',
        integration_profile_id: null,
        external_id: `external-${index}`,
        title: `Flow ${index}`,
        prompt: 'prompt',
        final_answer: null,
        status: 'completed',
        started_at: null,
        finished_at: `2026-06-27T12:${String(index).padStart(2, '0')}:00.000Z`,
        source: null,
        model: null,
        created_at: String(index).padStart(3, '0'),
      });
    }

    await enforceLatest100Retention(supabase as never, 'integration-1');

    expect(supabase.flows).toHaveLength(100);
    expect(supabase.flows.some((flow) => flow.id === 'flow-0')).toBe(false);
    expect(supabase.flows.some((flow) => flow.id === 'flow-104')).toBe(true);
  });
});
