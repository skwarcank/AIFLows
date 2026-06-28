import type { MissionProfile } from '@/lib/mission-control';

interface Props {
  profiles: MissionProfile[];
  selectedProfileId: string | null;
  onSelectProfile: (id: string) => void;
}

export default function ProfileTabs({ profiles, selectedProfileId, onSelectProfile }: Props) {
  if (profiles.length === 0) return null;

  return (
    <div className="profile-tabs-panel" aria-label="Integration Profiles">
      <span className="profile-tabs-label">Profiles:</span>
      <div className="profile-tabs" role="tablist" aria-label="Integration Profiles">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            className={`profile-tab ${profile.id === selectedProfileId ? 'profile-tab-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={profile.id === selectedProfileId}
            onClick={() => onSelectProfile(profile.id)}
          >
            {profile.name || profile.externalId}
          </button>
        ))}
      </div>
    </div>
  );
}
