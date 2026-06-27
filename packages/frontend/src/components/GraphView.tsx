import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import type { FlowStep } from "../types";

interface Props {
  steps: FlowStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}

const NODE_COLORS: Record<string, string> = {
  user_prompt: "#3b82f6",
  tool_call: "#f59e0b",
  tool_result: "#22c55e",
  assistant_response: "#a855f7",
  error: "#ef4444",
};

const NODE_BG_COLORS: Record<string, string> = {
  user_prompt: "var(--node-bg-user-prompt)",
  tool_call: "var(--node-bg-tool-call)",
  tool_result: "var(--node-bg-tool-result)",
  assistant_response: "var(--node-bg-assistant-response)",
  error: "var(--node-bg-error)",
};

function truncate(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function stepToNode(step: FlowStep, index: number): Node {
  return {
    id: step.id,
    type: "flowNode",
    position: { x: 0, y: index * 120 },
    data: { step, index },
  };
}

function stepsToEdges(steps: FlowStep[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 1; i < steps.length; i += 1) {
    edges.push({
      id: `edge-${steps[i - 1].id}-${steps[i].id}`,
      source: steps[i - 1].id,
      target: steps[i].id,
      type: "smoothstep",
      animated: false,
    });
  }
  return edges;
}

function FlowNode({ data, selected }: NodeProps) {
  const step = data.step as FlowStep;
  const borderColor = NODE_COLORS[step.type] || "var(--text-secondary)";
  const bgColor = NODE_BG_COLORS[step.type] || "var(--surface)";

  return (
    <div
      className="flow-node"
      style={{
        borderColor: selected ? borderColor : "var(--border)",
        borderWidth: selected ? 2 : 1,
        backgroundColor: bgColor,
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-header" style={{ color: borderColor }}>
        {step.title}
      </div>
      <div className="flow-node-summary">{truncate(step.summary)}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { flowNode: FlowNode };

function FlowGraph({ steps, selectedStepId, onSelectStep }: Props) {
  const nodes = useMemo(
    () =>
      steps.map((step, index) => ({
        ...stepToNode(step, index),
        selected: step.id === selectedStepId,
      })),
    [steps, selectedStepId]
  );
  const edges = useMemo(() => stepsToEdges(steps), [steps]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onSelectStep(node.id);
    },
    [onSelectStep]
  );

  const onPaneClick = useCallback(() => {
    onSelectStep("");
  }, [onSelectStep]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      minZoom={0.3}
      maxZoom={2}
      nodesFocusable={false}
      edgesFocusable={false}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export default FlowGraph;
