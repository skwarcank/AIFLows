"use client";

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Background, Controls, MarkerType, Position, ReactFlow, type Edge, type Node, type NodeMouseHandler, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { MissionFlow, MissionFlowStep } from '@/lib/mission-control';
import { buildTraceSteps, rawStepToTraceStep, traceStepCategoryStyles, type TraceStep, type TraceStepCategory } from '@/lib/trace-steps';

type GraphViewMode = 'story' | 'raw';

type GraphNodeData = Record<string, unknown> & {
  traceStep?: TraceStep;
  rawStep?: MissionFlowStep;
  label: ReactNode;
};

function truncate(value: string | null | undefined, maxLength = 96) {
  if (!value) return '';
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function statusLabel(status: TraceStep['status']) {
  if (status === 'failed') return 'Failed';
  if (status === 'warning') return 'Warning';
  if (status === 'running') return 'Running';
  if (status === 'success') return 'Success';
  return 'Unknown';
}

function nodePosition(index: number, child = false) {
  return {
    x: 280 * index,
    y: child ? 190 : index % 2 === 0 ? 0 : 78,
  };
}

function buildStoryGraph(traceSteps: TraceStep[], expandedGroupId: string | null) {
  const visibleTraceSteps = traceSteps.flatMap((traceStep) => (traceStep.id === expandedGroupId && traceStep.children?.length ? [traceStep, ...traceStep.children] : [traceStep]));
  const nodes: Node<GraphNodeData>[] = visibleTraceSteps.map((traceStep, index) => {
    const style = traceStepCategoryStyles[traceStep.category];
    const isChild = traceSteps.some((parent) => parent.children?.some((child) => child.id === traceStep.id));
    return {
      id: traceStep.id,
      type: 'default',
      position: nodePosition(index, isChild),
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        traceStep,
        label: <StoryNodeLabel traceStep={traceStep} />,
      },
      className: `flow-node story-node ${style.className} ${traceStep.status === 'failed' ? 'trace-status-failed' : ''} ${traceStep.children?.length ? 'trace-node-group' : ''} ${isChild ? 'trace-node-child' : ''}`,
    };
  });

  const edges: Edge[] = [];
  for (let index = 1; index < visibleTraceSteps.length; index += 1) {
    const previous = visibleTraceSteps[index - 1];
    const current = visibleTraceSteps[index];
    edges.push({
      id: `${previous.id}->${current.id}`,
      source: previous.id,
      target: current.id,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      className: 'flow-edge',
    });
  }

  return { nodes, edges };
}

function buildRawGraph(flow: MissionFlow) {
  const nodes: Node<GraphNodeData>[] = flow.steps.map((step, index) => {
    const traceStep = rawStepToTraceStep(step);
    return {
      id: `raw-${step.id}`,
      type: 'default',
      position: nodePosition(index),
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        rawStep: step,
        traceStep,
        label: <RawNodeLabel step={step} traceStep={traceStep} />,
      },
      className: `flow-node raw-node ${traceStep.status === 'failed' ? 'trace-status-failed' : ''}`,
    };
  });

  const edges: Edge[] = [];
  for (let index = 1; index < nodes.length; index += 1) {
    edges.push({
      id: `${nodes[index - 1].id}->${nodes[index].id}`,
      source: nodes[index - 1].id,
      target: nodes[index].id,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      className: 'flow-edge raw-edge',
    });
  }
  return { nodes, edges };
}

export default function FlowGraph({ flow }: { flow: MissionFlow }) {
  const [viewMode, setViewMode] = useState<GraphViewMode>('story');
  const [selectedTraceStep, setSelectedTraceStep] = useState<TraceStep | null>(null);
  const [selectedRawStep, setSelectedRawStep] = useState<MissionFlowStep | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<Node<GraphNodeData>, Edge> | null>(null);

  const traceSteps = useMemo(() => buildTraceSteps(flow), [flow]);
  const { nodes, edges } = useMemo(() => (viewMode === 'story' ? buildStoryGraph(traceSteps, expandedGroupId) : buildRawGraph(flow)), [expandedGroupId, flow, traceSteps, viewMode]);

  useEffect(() => {
    if (!flowInstance) return;

    const timeout = window.setTimeout(() => {
      flowInstance.fitView({ padding: isFullscreen ? 0.24 : 0.18, duration: 260 });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [expandedGroupId, flowInstance, isFullscreen, nodes.length, viewMode]);

  const onNodeClick: NodeMouseHandler<Node<GraphNodeData>> = (_event, node) => {
    const rawStep = node.data.rawStep ?? null;
    const traceStep = node.data.traceStep ?? null;
    if (viewMode === 'story' && traceStep?.children?.length) {
      setExpandedGroupId((current) => (current === traceStep.id ? null : traceStep.id));
    }
    setSelectedTraceStep(traceStep);
    setSelectedRawStep(rawStep);
  };

  const changeMode = (mode: GraphViewMode) => {
    setViewMode(mode);
    setSelectedTraceStep(null);
    setSelectedRawStep(null);
    setExpandedGroupId(null);
  };

  const graph = (
    <div className={`flow-graph-shell ${isFullscreen ? 'flow-graph-fullscreen' : ''}`}>
      <GraphToolbar
        viewMode={viewMode}
        onViewModeChange={changeMode}
        isFullscreen={isFullscreen}
        onFullscreenChange={setIsFullscreen}
        legendOpen={legendOpen}
        onLegendOpenChange={setLegendOpen}
      />
      <div className="flow-graph" aria-label={viewMode === 'story' ? 'Story graph' : 'Raw trace graph'}>
        <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.18 }} minZoom={0.2} maxZoom={1.5} nodesDraggable={false} nodesConnectable={false} elementsSelectable onInit={setFlowInstance} onNodeClick={onNodeClick}>
          <Background color="rgba(148, 163, 184, 0.18)" gap={18} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <TraceDetailsDrawer traceStep={selectedTraceStep} rawStep={selectedRawStep} mode={viewMode} onClose={() => { setSelectedTraceStep(null); setSelectedRawStep(null); }} />
    </div>
  );

  return graph;
}

function GraphToolbar({ viewMode, onViewModeChange, isFullscreen, onFullscreenChange, legendOpen, onLegendOpenChange }: {
  viewMode: GraphViewMode;
  onViewModeChange: (mode: GraphViewMode) => void;
  isFullscreen: boolean;
  onFullscreenChange: (fullscreen: boolean) => void;
  legendOpen: boolean;
  onLegendOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="flow-graph-toolbar">
      <div className="graph-toggle" aria-label="Graph view toggle">
        <button type="button" className={viewMode === 'story' ? 'active' : ''} onClick={() => onViewModeChange('story')}>Story</button>
        <button type="button" className={viewMode === 'raw' ? 'active' : ''} onClick={() => onViewModeChange('raw')}>Raw</button>
      </div>
      <div className="graph-actions">
        <button type="button" onClick={() => onLegendOpenChange(!legendOpen)}>Legend</button>
        <button type="button" onClick={() => onFullscreenChange(!isFullscreen)}>{isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}</button>
      </div>
      {legendOpen ? <GraphLegend /> : null}
    </div>
  );
}

function GraphLegend() {
  return (
    <div className="graph-legend" role="dialog" aria-label="Story graph legend">
      {Object.entries(traceStepCategoryStyles).map(([category, style]) => (
        <div key={category}>
          <span>{style.icon}</span>
          <strong>{style.label}</strong>
        </div>
      ))}
    </div>
  );
}

function StoryNodeLabel({ traceStep }: { traceStep: TraceStep }) {
  const style = traceStepCategoryStyles[traceStep.category];
  const errorCount = traceStep.group?.errorCount ?? 0;
  return (
    <div className="flow-node-label story-node-label">
      <strong><span aria-hidden>{style.icon}</span> {traceStep.title}</strong>
      <small>{style.label} · {traceStep.sourceStepCount} event{traceStep.sourceStepCount === 1 ? '' : 's'} · {statusLabel(traceStep.status)}{errorCount ? ` · ${errorCount} errors` : ''}</small>
      {traceStep.children?.length ? <button type="button" className="expand-pill">{traceStep.children.length} substeps · click to {traceStep.group ? 'expand/collapse' : 'open'}</button> : null}
    </div>
  );
}

function RawNodeLabel({ step, traceStep }: { step: MissionFlowStep; traceStep: TraceStep }) {
  return (
    <div className="flow-node-label raw-node-label">
      <span>{step.kind}{step.toolName ? ` · ${step.toolName}` : ''}</span>
      <strong>{truncate(step.title, 58)}</strong>
      <small>Event {step.index} · {statusLabel(traceStep.status)}</small>
    </div>
  );
}

function TraceDetailsDrawer({ traceStep, rawStep, mode, onClose }: { traceStep: TraceStep | null; rawStep: MissionFlowStep | null; mode: GraphViewMode; onClose: () => void }) {
  if (!traceStep && !rawStep) return null;
  const rawPayload = rawStep ?? traceStep;
  const title = mode === 'raw' && rawStep ? rawStep.title : traceStep?.title ?? rawStep?.title ?? 'Trace event';
  const failure = traceStep?.status === 'failed';
  return (
    <aside className="trace-drawer" aria-label="Node details drawer">
      <div className="trace-drawer-header">
        <div>
          <p className="eyebrow">{mode === 'raw' ? 'Raw event details' : 'Story node details'}</p>
          <h4>{title}</h4>
        </div>
        <button type="button" onClick={onClose} aria-label="Close node details">×</button>
      </div>

      {failure ? <div className="trace-error-callout">This node includes a failure/error signal from the shallow stored trace.</div> : null}

      <section>
        <h5>Human explanation</h5>
        <p>{mode === 'raw' && rawStep ? rawStep.description ?? 'This is one stored shallow event from the chronological raw trace.' : traceStep?.summary}</p>
      </section>
      <section>
        <h5>Outcome</h5>
        <p>{traceStep?.outcome ?? (rawStep?.description || 'No outcome description stored for this raw event.')}</p>
      </section>
      <section>
        <h5>Evidence</h5>
        <ul>
          <li>Status: {traceStep ? statusLabel(traceStep.status) : 'Unknown'}</li>
          <li>Source steps: {traceStep?.sourceStepCount ?? 1}</li>
          {rawStep?.toolName ? <li>Tool: {rawStep.toolName}</li> : null}
          {traceStep?.sourceReferences.map((reference) => (
            <li key={reference.id}>#{reference.index} {reference.kind}{reference.toolName ? ` · ${reference.toolName}` : ''}: {reference.title}</li>
          ))}
        </ul>
      </section>
      <details>
        <summary>Raw events/data</summary>
        <pre>{JSON.stringify(rawPayload, null, 2)}</pre>
      </details>
    </aside>
  );
}
