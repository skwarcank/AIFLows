"use client";

import { useMemo } from 'react';
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { MissionFlow } from '@/lib/mission-control';

function truncate(value: string | null | undefined, maxLength = 96) {
  if (!value) return '';
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function nodeKindClass(kind: string) {
  if (kind.includes('tool')) return 'flow-node-tool';
  if (kind.includes('assistant')) return 'flow-node-assistant';
  if (kind.includes('user')) return 'flow-node-user';
  return 'flow-node-default';
}

export default function FlowGraph({ flow }: { flow: MissionFlow }) {
  const { nodes, edges } = useMemo(() => {
    const graphNodes: Node[] = [
      {
        id: 'prompt',
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: <NodeLabel eyebrow="Prompt" title={truncate(flow.prompt, 72) || flow.title} /> },
        className: 'flow-node flow-node-prompt',
      },
    ];

    const graphEdges: Edge[] = [];
    let previousId = 'prompt';

    flow.steps.forEach((step, index) => {
      const id = `step-${step.id}`;
      graphNodes.push({
        id,
        type: 'default',
        position: { x: 260 * (index + 1), y: index % 2 === 0 ? 0 : 140 },
        data: {
          label: (
            <NodeLabel
              eyebrow={step.toolName ? `Tool · ${step.toolName}` : step.kind}
              title={step.title}
              detail={truncate(step.description, 88)}
            />
          ),
        },
        className: `flow-node ${nodeKindClass(step.kind)}`,
      });
      graphEdges.push({
        id: `${previousId}->${id}`,
        source: previousId,
        target: id,
        animated: step.kind.includes('tool'),
        markerEnd: { type: MarkerType.ArrowClosed },
        className: 'flow-edge',
      });
      previousId = id;
    });

    if (flow.finalAnswer) {
      graphNodes.push({
        id: 'final',
        type: 'default',
        position: { x: 260 * (flow.steps.length + 1), y: 0 },
        data: { label: <NodeLabel eyebrow="Final" title={truncate(flow.finalAnswer, 90)} /> },
        className: 'flow-node flow-node-final',
      });
      graphEdges.push({
        id: `${previousId}->final`,
        source: previousId,
        target: 'final',
        markerEnd: { type: MarkerType.ArrowClosed },
        className: 'flow-edge',
      });
    }

    return { nodes: graphNodes, edges: graphEdges };
  }, [flow]);

  return (
    <div className="flow-graph" aria-label="Flow graph">
      <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.2} maxZoom={1.4} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}>
        <Background color="rgba(148, 163, 184, 0.18)" gap={18} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function NodeLabel({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div className="flow-node-label">
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}
