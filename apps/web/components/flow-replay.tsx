import FlowGraph from '@/components/flow-graph';
import StepTimeline from '@/components/step-timeline';
import type { MissionFlow } from '@/lib/mission-control';

export default function FlowReplay({ flow }: { flow: MissionFlow }) {
  return (
    <article className="info-card replay-card">
      <p className="eyebrow">Flow Replay</p>
      <h3>{flow.title}</h3>
      <p className="muted">{flow.model ?? 'unknown model'} · {flow.source ?? 'unknown source'} · {flow.status}</p>
      <div className="replay-section"><h4>Prompt</h4><p>{flow.prompt}</p></div>
      <div className="replay-section graph-section"><h4>Graph</h4><FlowGraph flow={flow} /></div>
      <StepTimeline flow={flow} />
      {flow.finalAnswer ? <div className="replay-section"><h4>Final answer</h4><p>{flow.finalAnswer}</p></div> : null}
    </article>
  );
}
