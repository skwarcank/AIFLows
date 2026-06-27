import { useMemo, useState } from "react";
import type { RunTrace, TraceEvent, FlowStep } from "../types";
import GraphView from "./GraphView";
import DetailPanel from "./DetailPanel";

interface Props {
  selectedTrace: RunTrace | null;
  selectedTraceId: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function toFlowStep(event: TraceEvent): FlowStep {
  return {
    id: event.id,
    type: event.type,
    title: event.title,
    summary: event.content ? event.content.slice(0, 120) : event.title,
    content: event.content,
    timestamp: event.timestamp,
    toolName: event.toolName,
    raw: event.raw,
  };
}

function MainContent({
  selectedTrace,
  selectedTraceId,
  loading,
  error,
  onRetry,
}: Props) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const steps = useMemo(
    () => selectedTrace?.events.map(toFlowStep) ?? [],
    [selectedTrace]
  );

  if (!selectedTraceId) {
    return (
      <div className="main-placeholder">
        <h2>Select a Flow to view</h2>
        <p>Choose a Flow from the sidebar to see its replay graph.</p>
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
        <h3>Failed to load Flow</h3>
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
        <h2>No Flow steps found</h2>
        <p>This Flow has no visible steps to display.</p>
      </div>
    );
  }

  const selectedStep = steps.find((step) => step.id === selectedStepId) ?? null;

  return (
    <div className="main-content-area">
      <div className="graph-container">
        <GraphView
          steps={steps}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
        />
      </div>
      <DetailPanel step={selectedStep} onClose={() => setSelectedStepId(null)} />
    </div>
  );
}

export default MainContent;
