import type { MissionFlow, MissionProfile } from '@/lib/mission-control';

export function chooseInitialProfileId(profiles: MissionProfile[]) {
  return profiles.find((profile) => profile.externalId === 'default' || profile.name === 'default')?.id ?? profiles[0]?.id ?? null;
}

export function getFlowsForProfile(flows: MissionFlow[], profileId: string | null) {
  if (!profileId) return [];
  return flows.filter((flow) => flow.profileId === profileId);
}

export function getTopFlowForProfile(flows: MissionFlow[], profileId: string | null) {
  return getFlowsForProfile(flows, profileId)[0] ?? null;
}
