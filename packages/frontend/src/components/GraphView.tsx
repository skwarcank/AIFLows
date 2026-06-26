import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import type { RunTrace, TraceEvent } from "../types";

interface Props {
  trace: RunTrace;
  selectedEventId: string | null;
  onSelectEvent: (event: TraceEvent | null) => void;
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

function eventToNode(event: TraceEvent, index: number): Node {
  return {
    id: event.id,
    type: "traceNode",
    position: { x: 0, y: index * 120 },
    data: { event, index },
  };
}

function eventsToEdges(events: TraceEvent[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 1; i < events.length; i++) {
    edges.push({
      id: `edge-${events[i - 1].id}-${events[i].id}`,
      source: events[i - 1].id,
      target: events[i].id,
      type: "smoothstep",
      animated: false,
    });
  }
  return edges;
}

function truncate(text: string, max = 100): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function TraceNode({ data, selected }: NodeProps) {
  const event = data.event as TraceEvent;
  const borderColor = NODE_COLORS[event.type] || "var(--text-secondary)";
  const bgColor = NODE_BG_COLORS[event.type] || "var(--surface)";

  return (
    <div
      className="trace-node"
      style={{
        borderColor: selected ? borderColor : "var(--border)",
        borderWidth: selected ? 2 : 1,
        backgroundColor: bgColor,
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="trace-node-header" style={{ color: borderColor }}>
        {event.title}
      </div>
      {event.content && (
        <div className="trace-node-content">{truncate(event.content)}</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { traceNode: TraceNode };

function GraphView({ trace, selectedEventId, onSelectEvent }: Props) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes = trace.events.map((event, index) => eventToNode(event, index));
    const edges = eventsToEdges(trace.events);
    return { nodes, edges };
  }, [trace]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const eventData = node.data.event as TraceEvent;
      onSelectEvent(eventData);
    },
    [onSelectEvent]
  );

  const onPaneClick = useCallback(() => {
    onSelectEvent(null);
  }, [onSelectEvent]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
      minZoom={0.3}
      maxZoom={2}
    >
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export default GraphView;
