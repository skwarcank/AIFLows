import type { TraceSummary } from "../types";
import FlowCard from "./TraceCard";

interface Props {
  traces: TraceSummary[];
  selectedTraceId: string | null;
  onSelect: (traceId: string) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function relativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function FlowSidebar({
  traces,
  selectedTraceId,
  onSelect,
  loading,
  error,
  onRetry,
}: Props) {
  if (loading && traces.length === 0) {
    return (
      <div className="trace-sidebar">
        <h2 className="sidebar-title">Flows</h2>
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="trace-sidebar">
        <h2 className="sidebar-title">Flows</h2>
        <div className="error-state">
          <span className="error-text">Failed to load Flows</span>
          <button className="retry-btn" onClick={onRetry}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trace-sidebar">
      <h2 className="sidebar-title">Flows</h2>
      {traces.length === 0 ? (
        <div className="empty-state">
          No Flows yet. Send a prompt to Hermes, then refresh.
        </div>
      ) : (
        <div className="trace-list">
          {traces.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              isSelected={flow.id === selectedTraceId}
              onSelect={onSelect}
              relativeTime={relativeTime(flow.startedAt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FlowSidebar;
