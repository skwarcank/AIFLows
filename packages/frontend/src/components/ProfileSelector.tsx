import type { Profile } from "../types";

interface Props {
  profiles: Profile[];
  selectedProfileId: string | null;
  onSelect: (profileId: string) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function ProfileSelector({
  profiles,
  selectedProfileId,
  onSelect,
  loading,
  error,
  onRetry,
}: Props) {
  if (loading) {
    return (
      <div className="profile-selector">
        <div className="skeleton skeleton-select" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-selector profile-selector-error">
        <span className="error-text">Failed to load profiles</span>
        <button className="retry-btn" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="profile-selector profile-selector-empty">
        <span className="empty-text">No Hermes profiles found</span>
      </div>
    );
  }

  return (
    <div className="profile-selector">
      <select
        value={selectedProfileId || ""}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="" disabled>
          Select a profile…
        </option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id} disabled={p.status !== "available"}>
            {p.label}
            {p.status !== "available" ? " (no database)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ProfileSelector;
