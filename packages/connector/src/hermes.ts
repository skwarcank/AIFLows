import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import Database from 'better-sqlite3';
import { normalizeStepKind, truncateText, type ShallowFlowPayload, type ShallowFlowStep } from '@aiflows/flow-core';
import type { SelectedHermesProfile } from './state.js';

export interface DiscoveredHermesHome {
  home: string;
  profilesDir: string;
  profiles: SelectedHermesProfile[];
}

interface MessageRow {
  id: number;
  role: string;
  content: string | null;
  timestamp: number | null;
  finish_reason: string | null;
  tool_calls: string | null;
  tool_call_id: string | null;
  tool_name: string | null;
  model?: string | null;
  session_id: string;
}

function candidateHomes(override?: string): string[] {
  if (override) return [resolve(override)];
  const home = homedir();
  return [process.env.HERMES_HOME, join(home, '.hermes'), join(home, '.config', 'hermes')].filter(Boolean).map((value) => resolve(String(value)));
}

export function discoverHermes(override?: string): DiscoveredHermesHome | null {
  for (const home of candidateHomes(override)) {
    const profilesDir = join(home, 'profiles');
    const profiles: SelectedHermesProfile[] = [];
    const rootDb = join(home, 'state.db');
    if (existsSync(rootDb)) profiles.push({ id: 'default', label: 'default', dbPath: rootDb, profileType: 'default' });
    if (existsSync(profilesDir)) {
      for (const entry of readdirSync(profilesDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const dbPath = join(profilesDir, entry.name, 'state.db');
        if (existsSync(dbPath)) profiles.push({ id: entry.name, label: entry.name, dbPath, profileType: 'named' });
      }
    }
    if (profiles.length > 0) return { home, profilesDir, profiles: profiles.sort((a, b) => a.id.localeCompare(b.id)) };
  }
  return null;
}

function toIso(seconds: number | null | undefined): string | undefined {
  if (seconds === null || seconds === undefined) return undefined;
  return new Date(Number(seconds) * 1000).toISOString();
}

function parseToolCalls(value: string | null | undefined): Array<{ id?: string; call_id?: string; function?: { name?: string; arguments?: string }; name?: string; arguments?: unknown }> {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stepDescription(row: MessageRow, fallback = ''): string | undefined {
  return truncateText(row.content ?? fallback, 1000);
}

function buildSteps(messages: MessageRow[]): ShallowFlowStep[] {
  const steps: ShallowFlowStep[] = [];
  const first = messages[0];
  const last = messages[messages.length - 1];
  steps.push({ externalId: `message-${first.id}`, index: 0, kind: 'prompt', title: 'User Prompt', description: truncateText(first.content ?? '', 4000), occurredAt: toIso(first.timestamp) });
  for (const message of messages.slice(1, -1)) {
    if (message.role === 'assistant' && message.finish_reason === 'tool_calls') {
      for (const [index, call] of parseToolCalls(message.tool_calls).entries()) {
        const name = call.function?.name || call.name || `tool_${index + 1}`;
        steps.push({ externalId: call.id || call.call_id || `message-${message.id}-tool-${index}`, index: steps.length, kind: 'tool_call', title: `Tool Call: ${name}`, description: truncateText(String(call.function?.arguments ?? call.arguments ?? ''), 1000), occurredAt: toIso(message.timestamp), toolName: name, metadata: { messageId: message.id } });
      }
    } else if (message.role === 'tool') {
      steps.push({ externalId: message.tool_call_id || `message-${message.id}-tool-result`, index: steps.length, kind: 'tool_result', title: `Tool Result${message.tool_name ? `: ${message.tool_name}` : ''}`, description: stepDescription(message), occurredAt: toIso(message.timestamp), toolName: message.tool_name ?? undefined, metadata: { messageId: message.id } });
    } else if (message.role !== 'assistant') {
      steps.push({ externalId: `message-${message.id}`, index: steps.length, kind: normalizeStepKind(message.role), title: message.role, description: stepDescription(message), occurredAt: toIso(message.timestamp), metadata: { messageId: message.id } });
    }
  }
  steps.push({ externalId: `message-${last.id}`, index: steps.length, kind: 'final_answer', title: 'Assistant Response', description: truncateText(last.content ?? '', 4000), occurredAt: toIso(last.timestamp), metadata: { messageId: last.id, finishReason: last.finish_reason } });
  return steps;
}

export function readCompletedFlows(profile: SelectedHermesProfile, limit = 20): ShallowFlowPayload[] {
  const db = new Database(profile.dbPath, { readonly: true, fileMustExist: true });
  try {
    const finals = db.prepare(`SELECT * FROM messages WHERE role = 'assistant' AND finish_reason = 'stop' AND active = 1 ORDER BY id DESC LIMIT ?`).all(limit) as MessageRow[];
    const flows: ShallowFlowPayload[] = [];
    for (const finalAssistant of finals) {
      const userPrompt = db.prepare(`SELECT * FROM messages WHERE session_id = ? AND role = 'user' AND active = 1 AND id < ? ORDER BY id DESC LIMIT 1`).get(finalAssistant.session_id, finalAssistant.id) as MessageRow | undefined;
      if (!userPrompt) continue;
      const session = db.prepare(`SELECT id, source, title FROM sessions WHERE id = ?`).get(finalAssistant.session_id) as { id: string; source: string | null; title: string | null } | undefined;
      const messages = db.prepare(`SELECT * FROM messages WHERE session_id = ? AND active = 1 AND id >= ? AND id <= ? ORDER BY id ASC`).all(finalAssistant.session_id, userPrompt.id, finalAssistant.id) as MessageRow[];
      const externalId = `${profile.id}:${finalAssistant.session_id}:${userPrompt.id}:${finalAssistant.id}`;
      flows.push({
        externalId,
        profile: { externalId: profile.id, name: profile.label, profileType: profile.profileType },
        title: session?.title || truncateText(userPrompt.content ?? '', 80) || 'Hermes Flow',
        prompt: userPrompt.content || '',
        finalAnswer: finalAssistant.content || undefined,
        status: 'completed',
        startedAt: toIso(userPrompt.timestamp),
        finishedAt: toIso(finalAssistant.timestamp),
        source: session?.source || 'unknown',
        model: finalAssistant.model || userPrompt.model || undefined,
        steps: buildSteps(messages),
      });
    }
    return flows;
  } finally {
    db.close();
  }
}
