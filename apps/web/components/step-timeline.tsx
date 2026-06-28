import type { MissionFlow } from '@/lib/mission-control';

export default function StepTimeline({ flow }: { flow: MissionFlow }) {
  return (
    <div className="timeline">
      {flow.steps.map((step) => (
        <div className="timeline-step" key={step.id}>
          <span className="timeline-dot" />
          <div>
            <strong>{step.title}</strong>
            <p>{step.description ?? 'No shallow description stored.'}</p>
            {step.toolName ? <p className="muted">Tool: {step.toolName}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
