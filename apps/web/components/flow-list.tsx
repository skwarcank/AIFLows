import { formatUtcDateTime } from '@/lib/date-format';
import type { MissionFlow } from '@/lib/mission-control';

interface Props {
  flows: MissionFlow[];
  selectedFlowId: string | null;
  onSelectFlow: (id: string) => void;
}

export default function FlowList({ flows, selectedFlowId, onSelectFlow }: Props) {
  return (
    <article className="info-card flow-list-card">
      <h3>Flows</h3>
      <div className="flow-list">
        {flows.map((flow) => (
          <button key={flow.id} className={`flow-list-item ${flow.id === selectedFlowId ? 'flow-list-item-active' : ''}`} type="button" onClick={() => onSelectFlow(flow.id)}>
            <strong>{flow.title}</strong>
            <span>{formatUtcDateTime(flow.finishedAt, 'No finish time')} · {flow.steps.length} steps</span>
          </button>
        ))}
      </div>
    </article>
  );
}
