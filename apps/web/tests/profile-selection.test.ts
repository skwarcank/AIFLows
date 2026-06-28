import { describe, expect, it } from 'vitest';

import { chooseInitialProfileId, getFlowsForProfile, getTopFlowForProfile } from '../lib/profile-selection';
import type { MissionFlow, MissionProfile } from '../lib/mission-control';

const profiles: MissionProfile[] = [
  { id: 'profile-asterion', externalId: 'asterion', name: 'asterion', profileType: 'hermes' },
  { id: 'profile-default', externalId: 'default', name: 'default', profileType: 'hermes' },
  { id: 'profile-empty', externalId: 'empty', name: 'empty', profileType: 'hermes' },
];

function flow(id: string, profileId: string, finishedAt: string): MissionFlow {
  return {
    id,
    externalId: `external-${id}`,
    profileId,
    title: `Flow ${id}`,
    prompt: `Prompt ${id}`,
    finalAnswer: `Answer ${id}`,
    status: 'completed',
    startedAt: finishedAt,
    finishedAt,
    source: 'hermes',
    model: null,
    steps: [],
  };
}

const flows: MissionFlow[] = [
  flow('default-newest', 'profile-default', '2026-06-27T12:00:00.000Z'),
  flow('asterion-newest', 'profile-asterion', '2026-06-27T11:00:00.000Z'),
  flow('default-older', 'profile-default', '2026-06-26T12:00:00.000Z'),
  flow('asterion-older', 'profile-asterion', '2026-06-25T12:00:00.000Z'),
];

describe('profile Mission Control selection', () => {
  it('selects the default Hermes profile first when it exists', () => {
    expect(chooseInitialProfileId(profiles)).toBe('profile-default');
  });

  it('falls back to the first available profile when default is absent', () => {
    expect(chooseInitialProfileId([profiles[0], profiles[2]])).toBe('profile-asterion');
  });

  it('filters flows to the selected profile while preserving existing flow order', () => {
    expect(getFlowsForProfile(flows, 'profile-default').map((candidate) => candidate.id)).toEqual(['default-newest', 'default-older']);
  });

  it('selects the top flow for the selected profile', () => {
    expect(getTopFlowForProfile(flows, 'profile-asterion')?.id).toBe('asterion-newest');
  });

  it('keeps empty profiles selectable without a selected flow', () => {
    expect(getFlowsForProfile(flows, 'profile-empty')).toEqual([]);
    expect(getTopFlowForProfile(flows, 'profile-empty')).toBeNull();
  });
});
