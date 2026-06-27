import type { TraceSummary } from "../types";

interface Props {
  flow: TraceSummary;
  isSelected: boolean;
  onSelect: (flowId: string) => void;
  relativeTime: string;
}

function sourceBadgeClass(source: string): string {
  switch (source) {
    case "telegram":
      return "badge-telegram";
    case "cli":
      return "badge-cli";
    default:
      return "badge-unknown";
  }
}

function FlowCard({ flow, isSelected, onSelect, relativeTime }: Props) {
  return (
    <div
      className={`trace-card ${isSelected ? "trace-card-selected" : ""}`}
      onClick={() => onSelect(flow.id)}
    >
      <div className="trace-card-header">
        <span className={`source-badge ${sourceBadgeClass(flow.source)}`}>
          {flow.source}
        </span>
        <span className="trace-time">{relativeTime}</span>
      </div>
      <div className="trace-card-body">
        <p className="trace-prompt">{flow.promptPreview}</p>
        {flow.finalAnswerPreview && (
          <p className="trace-answer">{flow.finalAnswerPreview}</p>
        )}
      </div>
    </div>
  );
}

export default FlowCard;
