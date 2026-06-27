import { useEffect, useMemo, useState } from "react";
import type { FlowDetail, FlowStep } from "../types";
import { fetchHermesFlow } from "../api";
import FlowGraph from "./GraphView";
import DetailPanel from "./DetailPanel";
import StepTimeline from "./StepTimeline";

interface Props {
  profileId: string;
  flowId: string;
  onNavigate: (path: string) => void;
}

type MobileTab = "graph" | "timeline" | "details";

function FlowReplayPage({ profileId, flowId, onNavigate }: Props) {
  const [flow, setFlow] = useState<FlowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("graph");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setSelectedStepId(null);
    setMobileTab("graph");
    fetchHermesFlow(profileId, flowId)
      .then((data) => {
        if (!active) return;
        setFlow(data.flow);
        setSelectedStepId(data.flow.steps[0]?.id ?? null);
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
  }, [profileId, flowId]);

  const selectedStep = useMemo<FlowStep | null>(() => {
    if (!flow || !selectedStepId) return null;
    return flow.steps.find((step) => step.id === selectedStepId) ?? null;
  }, [flow, selectedStepId]);

  const handleSelectStep = (stepId: string) => {
    if (!stepId) return;
    setSelectedStepId(stepId);
    setMobileTab("details");
  };

  return (
    <section className="page-shell flow-replay-shell">
      <header className="page-header page-header-stack flow-header">
        <div className="flow-header-breadcrumbs">
          <button className="breadcrumb-link" onClick={() => onNavigate("/")}>Mission Control</button>
          <span>›</span>
          <button className="breadcrumb-link" onClick={() => onNavigate("/adapters/hermes")}>Hermes</button>
          <span>›</span>
          <button className="breadcrumb-link" onClick={() => onNavigate(`/adapters/hermes/profiles/${encodeURIComponent(profileId)}`)}>{profileId}</button>
        </div>
        <div>
          <p className="eyebrow">Flow Replay</p>
          <h2>{flow?.promptPreview ?? "Loading Flow…"}</h2>
          {flow && <p className="page-lead">{flow.model} · {new Date(flow.finishedAt).toLocaleString()}</p>}
        </div>
      </header>

      {loading && <div className="page-empty">Loading Flow…</div>}

      {error && !loading && (
        <div className="page-empty page-error">
          <h3>Could not load Flow</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && flow && (
        <div className="flow-replay-layout">
          <div className={`flow-panel-graph ${mobileTab === "graph" ? "is-active" : ""}`}>
            <FlowGraph
              steps={flow.steps}
              selectedStepId={selectedStepId}
              onSelectStep={handleSelectStep}
            />
          </div>

          <div className="flow-inspector">
            <div className="flow-mobile-tabs">
              <button className={mobileTab === "graph" ? "is-active" : ""} onClick={() => setMobileTab("graph")}>Graph</button>
              <button className={mobileTab === "timeline" ? "is-active" : ""} onClick={() => setMobileTab("timeline")}>Timeline</button>
              <button className={mobileTab === "details" ? "is-active" : ""} onClick={() => setMobileTab("details")}>Details</button>
            </div>

            <div className={`flow-inspector-panel flow-inspector-timeline ${mobileTab === "timeline" ? "is-active" : ""}`}>
              <h3>Timeline</h3>
              <StepTimeline
                steps={flow.steps}
                selectedStepId={selectedStepId}
                onSelectStep={(stepId) => {
                  setSelectedStepId(stepId);
                  setMobileTab("details");
                }}
              />
            </div>

            <div className={`flow-inspector-panel flow-inspector-details ${mobileTab === "details" ? "is-active" : ""}`}>
              <h3>Selected Step</h3>
              <DetailPanel
                step={selectedStep}
                onClose={() => {
                  setSelectedStepId(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default FlowReplayPage;
