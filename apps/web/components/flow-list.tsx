import { formatUtcDateTime } from '@/lib/date-format';
import type { MissionFlow } from '@/lib/mission-control';

interface Props {
  flows: MissionFlow[];
  selectedFlowId: string | null;
  selectedProfileName?: string | null;
  onSelectFlow: (id: string) => void;
}

export default function FlowList({ flows, selectedFlowId, selectedProfileName, onSelectFlow }: Props) {
  return (
    <article className="info-card flow-list-card">
      <h3>Flows</h3>
      {flows.length === 0 ? (
        <p className="empty-state">No Flows synced for <code>{selectedProfileName ?? 'this profile'}</code> yet. Keep the connector running, sync recent history, or choose another profile.</p>
      ) : (
        <div className="flow-list">
          {flows.map((flow) => (
            <button key={flow.id} className={`flow-list-item ${flow.id === selectedFlowId ? 'flow-list-item-active' : ''}`} type="button" onClick={() => onSelectFlow(flow.id)}>
              <strong>{flow.title}</strong>
              <span>{formatUtcDateTime(flow.finishedAt, 'No finish time')} · {flow.steps.length} steps</span>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
