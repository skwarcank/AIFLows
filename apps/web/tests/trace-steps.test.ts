import { describe, expect, it } from 'vitest';

import type { MissionFlow } from '../lib/mission-control';
import { buildTraceSteps } from '../lib/trace-steps';

function flow(overrides: Partial<MissionFlow>): MissionFlow {
  return {
    id: 'flow-1',
    externalId: 'external-flow-1',
    profileId: 'profile-1',
    title: 'Example flow',
    prompt: 'Help me understand this project',
    finalAnswer: 'Done.',
    status: 'completed',
    startedAt: null,
    finishedAt: null,
    source: 'hermes',
    model: 'test-model',
    steps: [],
    ...overrides,
  };
}

describe('TraceStep story interpreter', () => {
  it('turns a coding-shaped trace into grouped readable TraceSteps with source references', () => {
    const traceSteps = buildTraceSteps(flow({
      steps: [
        { id: 's1', externalId: 'e1', index: 1, kind: 'tool_call', title: 'Searched project files', description: 'Looked for graph components.', toolName: 'search_files', metadata: {}, occurredAt: null },
        { id: 's2', externalId: 'e2', index: 2, kind: 'tool_call', title: 'Read graph component', description: 'Inspected current Flow graph.', toolName: 'read_file', metadata: {}, occurredAt: null },
        { id: 's3', externalId: 'e3', index: 3, kind: 'tool_call', title: 'Patched Flow graph', description: 'Updated the graph component.', toolName: 'patch', metadata: {}, occurredAt: null },
        { id: 's4', externalId: 'e4', index: 4, kind: 'tool_result', title: 'Ran typecheck', description: 'Checked TypeScript.', toolName: 'terminal', metadata: { status: 'success' }, occurredAt: null },
      ],
    }));

    expect(traceSteps.map((step) => step.category)).toContain('context_gathering');
    const context = traceSteps.find((step) => step.category === 'context_gathering');
    expect(context?.children).toHaveLength(2);
    expect(context?.sourceStepCount).toBe(2);
    expect(context?.sourceStepIds).toEqual(['s1', 's2']);
    expect(context?.title).toBe('Gathered context');
    expect(traceSteps.find((step) => step.category === 'artifact')?.sourceStepIds).toEqual(['s3']);
    expect(traceSteps.find((step) => step.category === 'verification')?.sourceStepIds).toEqual(['s4']);
  });

  it('keeps non-coding traces generic and marks error status without inventing private reasoning', () => {
    const traceSteps = buildTraceSteps(flow({
      prompt: 'Plan a weekend trip',
      steps: [
        { id: 't1', externalId: 'te1', index: 1, kind: 'tool_call', title: 'Researched travel options', description: 'Searched for train routes.', toolName: 'browser_navigate', metadata: {}, occurredAt: null },
        { id: 't2', externalId: 'te2', index: 2, kind: 'tool_call', title: 'Compared hotels', description: 'Reviewed options.', toolName: 'browser_snapshot', metadata: {}, occurredAt: null },
        { id: 't3', externalId: 'te3', index: 3, kind: 'error', title: 'Booking site failed', description: 'The external page returned an error.', toolName: 'browser_click', metadata: {}, occurredAt: null },
      ],
    }));

    expect(traceSteps[0]).toMatchObject({ category: 'conversation', title: 'User request' });
    expect(traceSteps.some((step) => step.title.includes('Researched travel'))).toBe(true);
    const error = traceSteps.find((step) => step.category === 'error_recovery');
    expect(error).toMatchObject({ status: 'failed', sourceStepIds: ['t3'] });
    expect(JSON.stringify(traceSteps).toLowerCase()).not.toContain('chain-of-thought');
  });
});
