import { useEffect, useState } from "react";
import type { FlowSummary } from "../types";
import { fetchHermesFlows } from "../api";

interface Props {
  profileId: string;
  onNavigate: (path: string) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

function HermesFlowsPage({ profileId, onNavigate }: Props) {
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emptyState, setEmptyState] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setFlows([]);
    fetchHermesFlows(profileId, 20, 0)
      .then((data) => {
        if (!active) return;
        setFlows(data.flows);
        setTotal(data.total);
        setHasMore(data.hasMore);
        if (data.flows.length === 0) {
          setEmptyState("No Flows yet. Send a prompt to Hermes, then refresh.");
        } else {
          setEmptyState(null);
        }
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
  }, [profileId]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchHermesFlows(profileId, 20, flows.length);
      setFlows((current) => [...current, ...data.flows]);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="page-shell">
      <header className="page-header page-header-stack">
        <div>
          <p className="eyebrow">Adapter · Hermes · {profileId}</p>
          <h2>Recent Flows</h2>
          <p className="page-lead">Latest 20 completed Flows first. Load more if you need older runs.</p>
        </div>
      </header>

      {loading && <div className="page-empty">Loading Flows…</div>}

      {error && !loading && (
        <div className="page-empty page-error">
          <h3>Could not load Flows</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && flows.length === 0 && (
        <div className="page-empty">
          <h3>No Flows yet</h3>
          <p>{emptyState}</p>
        </div>
      )}

      {!loading && !error && flows.length > 0 && (
        <>
          <div className="flow-list-meta">Showing {flows.length} of {total} Flows</div>
          <div className="flow-list">
            {flows.map((flow) => (
              <button
                key={flow.id}
                className="flow-card"
                onClick={() => onNavigate(`/adapters/hermes/profiles/${encodeURIComponent(profileId)}/flows/${encodeURIComponent(flow.id)}`)}
              >
                <div className="flow-card-header">
                  <span>{flow.model}</span>
                  <span>{formatTime(flow.finishedAt)}</span>
                </div>
                <p className="flow-card-prompt">{flow.promptPreview}</p>
                <div className="flow-card-footer">{flow.stepCount} steps</div>
              </button>
            ))}
          </div>
          {hasMore && (
            <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading more…" : "Load more"}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default HermesFlowsPage;
