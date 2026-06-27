import { useEffect, useState } from "react";
import type { HermesProfile } from "../types";
import { fetchHermesProfiles } from "../api";

interface Props {
  onNavigate: (path: string) => void;
}

function HermesProfilesPage({ onNavigate }: Props) {
  const [profiles, setProfiles] = useState<HermesProfile[]>([]);
  const [emptyState, setEmptyState] = useState<{ title: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchHermesProfiles()
      .then((data) => {
        if (!active) return;
        setProfiles(data.profiles);
        setEmptyState(data.emptyState ?? null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Adapter · Hermes</p>
          <h2>Choose a Hermes profile</h2>
          <p className="page-lead">Profile cards stay simple. Pick one to inspect its recent Flows.</p>
        </div>
      </header>

      {loading && <div className="page-empty">Loading profiles…</div>}

      {error && !loading && (
        <div className="page-empty page-error">
          <h3>Could not load Hermes profiles</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && profiles.length === 0 && (
        <div className="page-empty">
          <h3>{emptyState?.title ?? "No Hermes profiles found"}</h3>
          <p>{emptyState?.message ?? "Send a prompt to Hermes, then refresh Mission Control."}</p>
        </div>
      )}

      {!loading && !error && profiles.length > 0 && (
        <div className="profile-grid">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              className="profile-card"
              onClick={() => onNavigate(`/adapters/hermes/profiles/${encodeURIComponent(profile.id)}`)}
            >
              <h3>{profile.label}</h3>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default HermesProfilesPage;
