import type { TraceSummary } from "../types";

interface Props {
  trace: TraceSummary;
  isSelected: boolean;
  onSelect: (traceId: string) => void;
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

function TraceCard({ trace, isSelected, onSelect, relativeTime }: Props) {
  return (
    <div
      className={`trace-card ${isSelected ? "trace-card-selected" : ""}`}
      onClick={() => onSelect(trace.id)}
    >
      <div className="trace-card-header">
        <span className={`source-badge ${sourceBadgeClass(trace.source)}`}>
          {trace.source}
        </span>
        <span className="trace-time">{relativeTime}</span>
      </div>
      <div className="trace-card-body">
        <p className="trace-prompt">{trace.promptPreview}</p>
        {trace.finalAnswerPreview && (
          <p className="trace-answer">{trace.finalAnswerPreview}</p>
        )}
      </div>
    </div>
  );
}

export default TraceCard;
