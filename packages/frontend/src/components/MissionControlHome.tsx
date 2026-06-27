import { useEffect, useState } from "react";
import type { AdapterInfo } from "../types";
import { fetchAdapters } from "../api";

interface Props {
  onNavigate: (path: string) => void;
}

const COMING_SOON = [
  { id: "opencode", name: "OpenCode" },
  { id: "claude-code", name: "Claude Code" },
  { id: "codex", name: "Codex" },
] as const;

function MissionControlHome({ onNavigate }: Props) {
  const [adapters, setAdapters] = useState<AdapterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchAdapters()
      .then((data) => {
        if (active) setAdapters(data);
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

  const hermes = adapters.find((adapter) => adapter.id === "hermes");

  return (
    <section className="page-shell page-home">
      <header className="page-header">
        <div>
          <p className="eyebrow">Mission Control</p>
          <h2>Watch agent systems, not just Flows.</h2>
          <p className="page-lead">
            Hermes is the first working adapter. Future adapters are visible as coming soon.
          </p>
        </div>
      </header>

      {loading && <div className="page-empty">Loading adapters…</div>}

      {error && !loading && (
        <div className="page-empty page-error">
          <h3>Could not load adapters</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="adapter-grid">
          <button
            className={`adapter-card adapter-card-active ${hermes ? "" : "is-disabled"}`}
            onClick={() => hermes && onNavigate("/adapters/hermes")}
            disabled={!hermes}
          >
            <span className="adapter-pill">Active</span>
            <h3>Hermes</h3>
            <p>
              {hermes
                ? `${hermes.profileCount} usable profile${hermes.profileCount === 1 ? "" : "s"}`
                : "No Hermes data yet"}
            </p>
          </button>

          {COMING_SOON.map((adapter) => (
            <button key={adapter.id} className="adapter-card is-disabled" disabled>
              <span className="adapter-pill adapter-pill-soon">Coming soon</span>
              <h3>{adapter.name}</h3>
              <p>Disabled for now. The backend only exposes real adapters.</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default MissionControlHome;
