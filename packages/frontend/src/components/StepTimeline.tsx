import type { FlowStep } from "../types";

interface Props {
  steps: FlowStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}

function StepTimeline({ steps, selectedStepId, onSelectStep }: Props) {
  return (
    <div className="step-timeline">
      {steps.map((step) => (
        <button
          key={step.id}
          className={`step-timeline-item ${step.id === selectedStepId ? "is-selected" : ""}`}
          onClick={() => onSelectStep(step.id)}
        >
          <span className="step-timeline-type">{step.type.replace(/_/g, " ")}</span>
          <span className="step-timeline-title">{step.title}</span>
          <span className="step-timeline-summary">{step.summary}</span>
        </button>
      ))}
    </div>
  );
}

export default StepTimeline;
