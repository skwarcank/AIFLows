import type Database from "better-sqlite3";
import { type RunTrace, type TraceEvent } from "./types.js";

function toIso(seconds: number | null | undefined): string | undefined {
  if (seconds === null || seconds === undefined) return undefined;
  return new Date(Number(seconds) * 1000).toISOString();
}

function preview(text: string | null | undefined, max = 120): string {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function safeJsonParse(
  value: string | null | undefined
): { ok: true; value: unknown } | { ok: false; error: string; raw: string } {
  if (!value) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error: unknown) {
    return {
      ok: false,
      error: (error as Error).message,
      raw: value,
    };
  }
}

interface ToolCallShape {
  id?: string;
  call_id?: string;
  function?: { name?: string; arguments?: string };
  name?: string;
  arguments?: string;
}

function toolCallTitle(call: ToolCallShape, index: number): string {
  const name = call?.function?.name || call?.name || `tool_${index + 1}`;
  return `Tool Call: ${name}`;
}

function toolCallName(call: ToolCallShape, index: number): string {
  return call?.function?.name || call?.name || `tool_${index + 1}`;
}

function toolCallContent(call: ToolCallShape): string | undefined {
  const args = call?.function?.arguments ?? call?.arguments;
  if (typeof args === "string") return args;
  if (args === undefined) return undefined;
  return JSON.stringify(args);
}

interface Message {
  id: number;
  role: string;
  content: string | null;
  timestamp: number | null;
  finish_reason: string | null;
  tool_calls: string | null;
  tool_call_id: string | null;
  tool_name: string | null;
  session_id: string;
}

export function buildEvents(messages: Message[]): TraceEvent[] {
  const events: TraceEvent[] = [];
  const first = messages[0];
  const last = messages[messages.length - 1];

  events.push({
    id: `message-${first.id}`,
    type: "user_prompt",
    title: "User Prompt",
    content: first.content || "",
    timestamp: toIso(first.timestamp),
    raw: { messageId: first.id },
  });

  for (const message of messages.slice(1, -1)) {
    if (
      message.role === "assistant" &&
      message.finish_reason === "tool_calls"
    ) {
      const parsed = safeJsonParse(message.tool_calls);

      if (!parsed.ok) {
        events.push({
          id: `message-${message.id}-tool-calls-error`,
          type: "error",
          title: "Malformed Tool Calls",
          content: parsed.error,
          timestamp: toIso(message.timestamp),
          raw: { messageId: message.id, tool_calls: parsed.raw },
        });
        continue;
      }

      const calls = (Array.isArray(parsed.value) ? parsed.value : []) as ToolCallShape[];
      for (const [index, call] of calls.entries()) {
        events.push({
          id:
            call?.id ||
            call?.call_id ||
            `message-${message.id}-tool-call-${index + 1}`,
          type: "tool_call",
          title: toolCallTitle(call, index),
          content: toolCallContent(call),
          timestamp: toIso(message.timestamp),
          toolName: toolCallName(call, index),
          raw: call,
        });
      }
    }

    if (message.role === "tool") {
      const parsed = safeJsonParse(message.content);
      events.push({
        id: message.tool_call_id || `message-${message.id}-tool-result`,
        type: "tool_result",
        title: `Tool Result${message.tool_name ? `: ${message.tool_name}` : ""}`,
        content: message.content || "",
        timestamp: toIso(message.timestamp),
        toolName: message.tool_name || undefined,
        raw: parsed.ok
          ? parsed.value
          : { parseError: parsed.error, content: parsed.raw },
      });
    }
  }

  events.push({
    id: `message-${last.id}`,
    type: "assistant_response",
    title: "Assistant Response",
    content: last.content || "",
    timestamp: toIso(last.timestamp),
    raw: { messageId: last.id, finishReason: last.finish_reason },
  });

  return events;
}

function uniqueNodeId(baseId: string, usedIds: Set<string>): string {
  const safeBaseId = String(baseId || "event");
  let candidate = safeBaseId;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${safeBaseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  order: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function traceToGraphData(trace: RunTrace): GraphData {
  const usedIds = new Set<string>();
  const nodes: GraphNode[] = (trace.events || []).map(
    (event: TraceEvent, index: number) => ({
      id: uniqueNodeId(event.id || `event-${index + 1}`, usedIds),
      label: event.title || event.type || `Event ${index + 1}`,
      type: event.type || "unknown",
      order: index + 1,
    })
  );

  const edges: GraphEdge[] = [];
  for (let index = 1; index < nodes.length; index += 1) {
    const previous = nodes[index - 1];
    const current = nodes[index];
    edges.push({
      id: `edge-${previous.order}-to-${current.order}`,
      source: previous.id,
      target: current.id,
    });
  }

  return { nodes, edges };
}

export interface HermesDbConfig {
  dbPath: string;
  profile: string;
}

export function readTracesForProfile(
  db: Database.Database,
  config: HermesDbConfig
): RunTrace[] {
  const results = db
    .prepare(
      `SELECT m.*
       FROM messages m
       WHERE m.role = 'assistant'
         AND m.finish_reason = 'stop'
         AND m.active = 1
       ORDER BY m.id DESC`
    )
    .all() as Message[];

  const traces: RunTrace[] = [];

  for (const finalAssistant of results) {
    const userPrompt = db
      .prepare(
        `SELECT *
         FROM messages
         WHERE session_id = ?
           AND role = 'user'
           AND active = 1
           AND id < ?
         ORDER BY id DESC
         LIMIT 1`
      )
      .get(finalAssistant.session_id, finalAssistant.id) as Message | undefined;

    if (!userPrompt) continue;

    const session = db
      .prepare(
        `SELECT id, source, started_at, ended_at, title
         FROM sessions
         WHERE id = ?`
      )
      .get(finalAssistant.session_id) as
      | { id: string; source: string | null; started_at: number | null; ended_at: number | null; title: string | null }
      | undefined;

    const messages = db
      .prepare(
        `SELECT *
         FROM messages
         WHERE session_id = ?
           AND active = 1
           AND id >= ?
           AND id <= ?
         ORDER BY id ASC`
      )
      .all(finalAssistant.session_id, userPrompt.id, finalAssistant.id) as Message[];

    const events = buildEvents(messages);
    const traceId = `trace-${finalAssistant.session_id}-${userPrompt.id}-${finalAssistant.id}`;

    traces.push({
      id: traceId,
      profile: config.profile,
      sessionId: finalAssistant.session_id,
      source: session?.source || "unknown",
      status: "completed",
      startedAt: toIso(userPrompt.timestamp) || "",
      finishedAt: toIso(finalAssistant.timestamp) || "",
      promptPreview: preview(userPrompt.content),
      finalAnswerPreview: preview(finalAssistant.content),
      events,
    });
  }

  return traces;
}

export function readLatestTrace(
  db: Database.Database,
  config: HermesDbConfig
): RunTrace {
  const traces = readTracesForProfile(db, config);
  if (traces.length === 0) {
    throw new Error("No completed traces found.");
  }
  return traces[0];
}
