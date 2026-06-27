import type { FlowStep } from "../types";

interface Props {
  step: FlowStep | null;
  onClose: () => void;
}

function DetailPanel({ step, onClose }: Props) {
  if (!step) {
    return (
      <div className="detail-panel detail-panel-empty">
        <p>Click a graph node or timeline item to see details.</p>
      </div>
    );
  }

  return (
    <div className="detail-panel">
      <div className="detail-panel-header">
        <div>
          <h3>{step.title}</h3>
          <p className="detail-panel-summary">{step.summary}</p>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Clear selection">
          ×
        </button>
      </div>

      <div className="detail-panel-meta">
        <span className="detail-type">{step.type.replace(/_/g, " ")}</span>
        {step.toolName && <span className="detail-tool">Tool: {step.toolName}</span>}
        {step.timestamp && (
          <span className="detail-time">{new Date(step.timestamp).toLocaleString()}</span>
        )}
      </div>

      {step.details && step.details.length > 0 && (
        <dl className="detail-fields">
          {step.details.map((item) => (
            <div key={`${step.id}-${item.label}`} className="detail-field">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {(step.type === "user_prompt" || step.type === "assistant_response") && step.content && (
        <div className="detail-panel-content">
          <pre>{step.content}</pre>
        </div>
      )}
    </div>
  );
}

export default DetailPanel;
