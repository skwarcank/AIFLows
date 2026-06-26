import type { RunTrace } from "../types";
import GraphView from "./GraphView";
import DetailPanel from "./DetailPanel";
import { useState } from "react";
import type { TraceEvent } from "../types";

interface Props {
  selectedTrace: RunTrace | null;
  selectedTraceId: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function MainContent({
  selectedTrace,
  selectedTraceId,
  loading,
  error,
  onRetry,
}: Props) {
  const [selectedEvent, setSelectedEvent] = useState<TraceEvent | null>(null);

  if (!selectedTraceId) {
    return (
      <div className="main-placeholder">
        <h2>Select a trace to view</h2>
        <p>Choose a trace from the sidebar to see its execution graph.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="main-loading">
        <div className="skeleton skeleton-graph" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-error">
        <h3>Failed to load trace</h3>
        <p className="error-text">{error}</p>
        <button className="retry-btn" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (!selectedTrace || selectedTrace.events.length === 0) {
    return (
      <div className="main-placeholder">
        <h2>No trace events found</h2>
        <p>This trace has no events to display.</p>
      </div>
    );
  }

  return (
    <div className="main-content-area">
      <div className="graph-container">
        <GraphView
          trace={selectedTrace}
          selectedEventId={selectedEvent?.id || null}
          onSelectEvent={setSelectedEvent}
        />
      </div>
      <DetailPanel
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

export default MainContent;
