const { DatabaseSync } = require('node:sqlite');

const PROFILE = 'default';
const DB_PATH = '/root/.hermes/state.db';

function toIso(seconds) {
  if (seconds === null || seconds === undefined) return undefined;
  return new Date(Number(seconds) * 1000).toISOString();
}

function preview(text, max = 120) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function safeJsonParse(value) {
  if (!value) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    return { ok: false, error: error.message, raw: value };
  }
}

function toolCallTitle(call, index) {
  const name = call?.function?.name || call?.name || `tool_${index + 1}`;
  return `Tool Call: ${name}`;
}

function toolCallName(call, index) {
  return call?.function?.name || call?.name || `tool_${index + 1}`;
}

function toolCallContent(call) {
  const args = call?.function?.arguments ?? call?.arguments;
  if (typeof args === 'string') return args;
  if (args === undefined) return undefined;
  return JSON.stringify(args);
}

function buildEvents(messages) {
  const events = [];
  const first = messages[0];
  const last = messages[messages.length - 1];

  events.push({
    id: `message-${first.id}`,
    type: 'user_prompt',
    title: 'User Prompt',
    content: first.content || '',
    timestamp: toIso(first.timestamp),
    raw: { messageId: first.id },
  });

  for (const message of messages.slice(1, -1)) {
    if (message.role === 'assistant' && message.finish_reason === 'tool_calls') {
      const parsed = safeJsonParse(message.tool_calls);

      if (!parsed.ok) {
        events.push({
          id: `message-${message.id}-tool-calls-error`,
          type: 'error',
          title: 'Malformed Tool Calls',
          content: parsed.error,
          timestamp: toIso(message.timestamp),
          raw: { messageId: message.id, tool_calls: parsed.raw },
        });
        continue;
      }

      const calls = Array.isArray(parsed.value) ? parsed.value : [];
      for (const [index, call] of calls.entries()) {
        events.push({
          id: call?.id || call?.call_id || `message-${message.id}-tool-call-${index + 1}`,
          type: 'tool_call',
          title: toolCallTitle(call, index),
          content: toolCallContent(call),
          timestamp: toIso(message.timestamp),
          toolName: toolCallName(call, index),
          raw: call,
        });
      }
    }

    if (message.role === 'tool') {
      const parsed = safeJsonParse(message.content);
      events.push({
        id: message.tool_call_id || `message-${message.id}-tool-result`,
        type: 'tool_result',
        title: `Tool Result${message.tool_name ? `: ${message.tool_name}` : ''}`,
        content: message.content || '',
        timestamp: toIso(message.timestamp),
        toolName: message.tool_name || undefined,
        raw: parsed.ok ? parsed.value : { parseError: parsed.error, content: parsed.raw },
      });
    }
  }

  events.push({
    id: `message-${last.id}`,
    type: 'assistant_response',
    title: 'Assistant Response',
    content: last.content || '',
    timestamp: toIso(last.timestamp),
    raw: { messageId: last.id, finishReason: last.finish_reason },
  });

  return events;
}

function uniqueNodeId(baseId, usedIds) {
  const safeBaseId = String(baseId || 'event');
  let candidate = safeBaseId;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${safeBaseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function traceToGraphData(trace) {
  const usedIds = new Set();
  const nodes = (trace.events || []).map((event, index) => ({
    id: uniqueNodeId(event.id || `event-${index + 1}`, usedIds),
    label: event.title || event.type || `Event ${index + 1}`,
    type: event.type || 'unknown',
    order: index + 1,
  }));

  const edges = [];
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

function readLatestTrace() {
  const db = new DatabaseSync(DB_PATH, { readOnly: true });

  try {
    const finalAssistant = db.prepare(`
      SELECT *
      FROM messages
      WHERE role = 'assistant'
        AND finish_reason = 'stop'
        AND active = 1
      ORDER BY id DESC
      LIMIT 1
    `).get();

    if (!finalAssistant) {
      throw new Error('No completed assistant(stop) message found.');
    }

    const userPrompt = db.prepare(`
      SELECT *
      FROM messages
      WHERE session_id = ?
        AND role = 'user'
        AND active = 1
        AND id < ?
      ORDER BY id DESC
      LIMIT 1
    `).get(finalAssistant.session_id, finalAssistant.id);

    if (!userPrompt) {
      throw new Error(`No user prompt found before assistant message ${finalAssistant.id}.`);
    }

    const session = db.prepare(`
      SELECT id, source, started_at, ended_at, title
      FROM sessions
      WHERE id = ?
    `).get(finalAssistant.session_id);

    const messages = db.prepare(`
      SELECT *
      FROM messages
      WHERE session_id = ?
        AND active = 1
        AND id >= ?
        AND id <= ?
      ORDER BY id ASC
    `).all(finalAssistant.session_id, userPrompt.id, finalAssistant.id);

    const events = buildEvents(messages);
    return {
      id: `trace-${finalAssistant.session_id}-${userPrompt.id}-${finalAssistant.id}`,
      profile: PROFILE,
      sessionId: finalAssistant.session_id,
      source: session?.source || 'unknown',
      status: 'completed',
      startedAt: toIso(userPrompt.timestamp),
      finishedAt: toIso(finalAssistant.timestamp),
      promptPreview: preview(userPrompt.content),
      finalAnswerPreview: preview(finalAssistant.content),
      events,
    };
  } finally {
    db.close();
  }
}

module.exports = {
  DB_PATH,
  PROFILE,
  readLatestTrace,
  traceToGraphData,
};
