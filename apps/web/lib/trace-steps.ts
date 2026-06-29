import type { MissionFlow, MissionFlowStep } from './mission-control';

export type TraceStepCategory =
  | 'conversation'
  | 'planning'
  | 'context_gathering'
  | 'analysis'
  | 'tool_action'
  | 'artifact'
  | 'verification'
  | 'error_recovery'
  | 'final_result';

export type TraceStepStatus = 'success' | 'running' | 'failed' | 'warning' | 'unknown';

export interface TraceStepSourceReference {
  id: string;
  externalId: string | null;
  index: number;
  kind: string;
  title: string;
  toolName: string | null;
}

export interface TraceStep {
  id: string;
  category: TraceStepCategory;
  title: string;
  summary: string;
  outcome: string;
  status: TraceStepStatus;
  sourceStepCount: number;
  sourceStepIds: string[];
  sourceReferences: TraceStepSourceReference[];
  sourceSteps: MissionFlowStep[];
  children?: TraceStep[];
  group?: {
    collapsedTitle: string;
    errorCount: number;
  };
}

const CONTEXT_TOOLS = new Set(['read_file', 'search_files', 'browser_snapshot', 'browser_get_images', 'vision_analyze', 'session_search']);
const ARTIFACT_TOOLS = new Set(['write_file', 'patch', 'image_generate', 'text_to_speech', 'skill_manage']);
const VERIFICATION_TOOLS = new Set(['terminal', 'execute_code', 'browser_console', 'browser_vision']);
const BROWSER_TOOLS = new Set(['browser_navigate', 'browser_click', 'browser_type', 'browser_press', 'browser_scroll']);
const ANALYSIS_TOOLS = new Set(['delegate_task']);

export const traceStepCategoryStyles: Record<TraceStepCategory, { label: string; icon: string; className: string }> = {
  conversation: { label: 'Conversation', icon: '💬', className: 'trace-category-conversation' },
  planning: { label: 'Planning', icon: '✅', className: 'trace-category-planning' },
  context_gathering: { label: 'Context gathering', icon: '📚', className: 'trace-category-context' },
  analysis: { label: 'Analysis', icon: '🧠', className: 'trace-category-analysis' },
  tool_action: { label: 'Tool action', icon: '🛠', className: 'trace-category-tool' },
  artifact: { label: 'Artifact creation/editing', icon: '📄', className: 'trace-category-artifact' },
  verification: { label: 'Verification', icon: '🧪', className: 'trace-category-verification' },
  error_recovery: { label: 'Error/recovery', icon: '⚠️', className: 'trace-category-error' },
  final_result: { label: 'Final result', icon: '🎯', className: 'trace-category-final' },
};

function normalizeText(value: string | null | undefined) {
  return (value ?? '').toLowerCase();
}

function titleIncludes(step: MissionFlowStep, terms: string[]) {
  const haystack = `${step.title} ${step.description ?? ''} ${step.toolName ?? ''}`.toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

function categoryForStep(step: MissionFlowStep): TraceStepCategory {
  if (step.kind === 'error' || titleIncludes(step, ['error', 'failed', 'failure', 'exception'])) return 'error_recovery';
  if (titleIncludes(step, ['plan', 'todo', 'approach', 'strategy'])) return 'planning';
  if (titleIncludes(step, ['verify', 'test', 'check', 'build', 'lint', 'typecheck'])) return 'verification';
  if (titleIncludes(step, ['analysis', 'analyze', 'reason', 'inspect image'])) return 'analysis';
  if (titleIncludes(step, ['write', 'edit', 'created', 'updated', 'patched', 'drafted'])) return 'artifact';

  const tool = step.toolName ?? '';
  if (CONTEXT_TOOLS.has(tool)) return 'context_gathering';
  if (ARTIFACT_TOOLS.has(tool)) return 'artifact';
  if (VERIFICATION_TOOLS.has(tool)) return titleIncludes(step, ['test', 'build', 'typecheck', 'lint', 'verify']) ? 'verification' : 'tool_action';
  if (BROWSER_TOOLS.has(tool)) return 'tool_action';
  if (ANALYSIS_TOOLS.has(tool)) return 'analysis';

  if (step.kind === 'prompt') return 'conversation';
  if (step.kind === 'final_answer') return 'final_result';
  if (step.kind.includes('tool')) return 'tool_action';
  return 'conversation';
}

function statusForStep(step: MissionFlowStep): TraceStepStatus {
  if (step.kind === 'error' || titleIncludes(step, ['error', 'failed', 'failure', 'exception'])) return 'failed';
  const status = normalizeText(String(step.metadata.status ?? step.metadata.exit_code ?? ''));
  if (status === 'failed' || status === 'error' || status === '1') return 'failed';
  if (status === 'running') return 'running';
  if (status === 'warning') return 'warning';
  return 'success';
}

function sourceReference(step: MissionFlowStep): TraceStepSourceReference {
  return {
    id: step.id,
    externalId: step.externalId,
    index: step.index,
    kind: step.kind,
    title: step.title,
    toolName: step.toolName,
  };
}

function humanCategory(category: TraceStepCategory) {
  return traceStepCategoryStyles[category].label.toLowerCase();
}

function leafTraceStep(step: MissionFlowStep): TraceStep {
  const category = categoryForStep(step);
  const status = statusForStep(step);
  const title = titleForStep(step, category);
  const summary = step.description || `${title} from stored ${step.kind.replace(/_/g, ' ')} event.`;
  return {
    id: `trace-${step.id}`,
    category,
    title,
    summary,
    outcome: status === 'failed' ? 'This event reported a failure or error signal.' : `Recorded ${humanCategory(category)} evidence from the synced trace.`,
    status,
    sourceStepCount: 1,
    sourceStepIds: [step.id],
    sourceReferences: [sourceReference(step)],
    sourceSteps: [step],
  };
}

function titleForStep(step: MissionFlowStep, category: TraceStepCategory) {
  if (step.title?.trim()) return step.title.trim();
  if (step.toolName) {
    if (category === 'context_gathering') return 'Gathered context';
    if (category === 'artifact') return 'Created or edited artifact';
    if (category === 'verification') return 'Checked result';
    return `Used ${step.toolName}`;
  }
  if (category === 'final_result') return 'Delivered final result';
  if (category === 'conversation') return 'Conversation event';
  return traceStepCategoryStyles[category].label;
}

function shouldGroup(category: TraceStepCategory) {
  return ['context_gathering', 'artifact', 'verification', 'analysis', 'tool_action'].includes(category);
}

function groupTitle(category: TraceStepCategory, children: TraceStep[]) {
  if (category === 'context_gathering') return children.some((c) => /browser|navigate|snapshot/i.test(c.title)) ? 'Inspected interface' : 'Gathered context';
  if (category === 'artifact') return 'Created or edited artifacts';
  if (category === 'verification') return 'Verified result';
  if (category === 'analysis') return 'Analyzed evidence';
  return 'Used tools';
}

function groupedTraceStep(category: TraceStepCategory, children: TraceStep[], groupIndex: number): TraceStep {
  const sourceSteps = children.flatMap((child) => child.sourceSteps);
  const errorCount = children.filter((child) => child.status === 'failed' || child.group?.errorCount).reduce((count, child) => count + (child.group?.errorCount ?? (child.status === 'failed' ? 1 : 0)), 0);
  const status: TraceStepStatus = errorCount > 0 ? 'failed' : children.some((child) => child.status === 'warning') ? 'warning' : 'success';
  const title = groupTitle(category, children);
  return {
    id: `trace-group-${category}-${groupIndex}-${children[0]?.sourceStepIds[0] ?? 'empty'}`,
    category,
    title,
    summary: `${children.length} related ${humanCategory(category)} events were grouped to keep the story readable.`,
    outcome: errorCount > 0 ? `${errorCount} grouped event${errorCount === 1 ? '' : 's'} reported an error.` : 'Grouped events completed without an error signal in the shallow trace.',
    status,
    sourceStepCount: sourceSteps.length,
    sourceStepIds: sourceSteps.map((step) => step.id),
    sourceReferences: sourceSteps.map(sourceReference),
    sourceSteps,
    children,
    group: {
      collapsedTitle: title,
      errorCount,
    },
  };
}

function promptTraceStep(flow: MissionFlow): TraceStep | null {
  if (!flow.prompt) return null;
  return {
    id: 'trace-flow-prompt',
    category: 'conversation',
    title: 'User request',
    summary: flow.prompt,
    outcome: 'This is the prompt that started the Flow.',
    status: 'success',
    sourceStepCount: 0,
    sourceStepIds: [],
    sourceReferences: [],
    sourceSteps: [],
  };
}

function finalTraceStep(flow: MissionFlow): TraceStep | null {
  if (!flow.finalAnswer) return null;
  return {
    id: 'trace-flow-final',
    category: 'final_result',
    title: 'Delivered final result',
    summary: flow.finalAnswer,
    outcome: 'This is the stored final assistant answer for the Flow.',
    status: flow.status === 'error' ? 'failed' : 'success',
    sourceStepCount: 0,
    sourceStepIds: [],
    sourceReferences: [],
    sourceSteps: [],
  };
}

export function buildTraceSteps(flow: MissionFlow): TraceStep[] {
  const story: TraceStep[] = [];
  const prompt = promptTraceStep(flow);
  if (prompt) story.push(prompt);

  const leaves = flow.steps.map(leafTraceStep);
  let groupIndex = 0;
  let currentGroup: TraceStep[] = [];
  let currentCategory: TraceStepCategory | null = null;

  const flushGroup = () => {
    if (currentGroup.length === 0 || currentCategory === null) return;
    if (currentGroup.length >= 2 && shouldGroup(currentCategory)) {
      story.push(groupedTraceStep(currentCategory, currentGroup, groupIndex));
      groupIndex += 1;
    } else {
      story.push(...currentGroup);
    }
    currentGroup = [];
    currentCategory = null;
  };

  for (const leaf of leaves) {
    if (leaf.category === currentCategory && shouldGroup(leaf.category)) {
      currentGroup.push(leaf);
      continue;
    }
    flushGroup();
    currentCategory = leaf.category;
    currentGroup = [leaf];
  }
  flushGroup();

  const final = finalTraceStep(flow);
  if (final) story.push(final);
  return story;
}

export function rawStepToTraceStep(step: MissionFlowStep): TraceStep {
  return leafTraceStep(step);
}
