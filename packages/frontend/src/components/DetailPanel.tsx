import type { TraceEvent } from "../types";

interface Props {
  event: TraceEvent | null;
  onClose: () => void;
}

function DetailPanel({ event, onClose }: Props) {
  if (!event) {
    return (
      <div className="detail-panel detail-panel-empty">
        <p>Click a node to see details</p>
      </div>
    );
  }

  return (
    <div className="detail-panel">
      <div className="detail-panel-header">
        <h3>{event.title}</h3>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="detail-panel-meta">
        <span className="detail-type">{event.type}</span>
        {event.toolName && (
          <span className="detail-tool">Tool: {event.toolName}</span>
        )}
        {event.timestamp && (
          <span className="detail-time">
            {new Date(event.timestamp).toLocaleString()}
          </span>
        )}
      </div>
      {event.content && (
        <div className="detail-panel-content">
          <pre>{event.content}</pre>
        </div>
      )}
    </div>
  );
}

export default DetailPanel;
