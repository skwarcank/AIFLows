import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { pairConnector, sendHeartbeat, uploadFlows, ConnectorApiError } from './api.js';
import { discoverHermes, readCompletedFlows } from './hermes.js';
import {
  clearFailedUpload,
  markFlowSynced,
  readConnectorState,
  recordFailedUpload,
  writeConnectorState,
  type ConnectorState,
  type SelectedHermesProfile,
} from './state.js';

interface ParsedArgs {
  command: string | null;
  token: string | null;
  apiBaseUrl?: string;
  hermesHome?: string;
  once: boolean;
  yes: boolean;
}

const POLL_INTERVAL_MS = 5000;

export async function runCli(argv = process.argv.slice(2)): Promise<number> {
  const parsed = parseArgs(argv);

  try {
    if (parsed.command === 'connect') return await runConnect(parsed);
    if (parsed.command === 'detect') return await runDetect(parsed);
    if (parsed.command === 'run') return await runConnector(parsed);
    printUsage();
    return parsed.command === 'help' ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connector failed.';
    console.error(message);
    return 1;
  }
}

async function runConnect(parsed: ParsedArgs): Promise<number> {
  if (!parsed.token) {
    console.error('Missing pairing token. Use: aiflows-connector connect --token <pairing-token>');
    return 1;
  }

  const { apiBaseUrl, response } = await pairConnector({ token: parsed.token, apiBaseUrl: parsed.apiBaseUrl });
  const statePath = await writeConnectorState({
    apiBaseUrl,
    connectorToken: response.connectorToken,
    integrationId: response.integration.id,
    workspaceId: response.integration.workspaceId,
    integrationName: response.integration.name,
    provider: response.integration.provider,
    pairedAt: new Date().toISOString(),
  });

  console.log('AIFlows Connector paired successfully.');
  console.log(`Integration: ${response.integration.name} (${response.integration.provider})`);
  console.log(`State saved to: ${statePath}`);
  console.log('Next step: run `aiflows-connector run` on the same machine/VPS as Hermes.');
  return 0;
}

async function runDetect(parsed: ParsedArgs): Promise<number> {
  const discovered = discoverHermes(parsed.hermesHome);
  if (!discovered) {
    console.error('No Hermes data found. Re-run with --hermes-home /path/to/.hermes if Hermes uses a custom location.');
    return 1;
  }

  console.log(`Hermes home: ${discovered.home}`);
  for (const profile of discovered.profiles) {
    console.log(`- ${profile.label} (${profile.profileType}) ${profile.dbPath}`);
  }
  return 0;
}

async function runConnector(parsed: ParsedArgs): Promise<number> {
  let state = await readConnectorState();
  if (!state) {
    console.error('Connector is not paired yet. Run the curl pairing command from Hosted AIFlows first.');
    return 1;
  }

  state = await ensureHermesSelection(state, parsed);
  await writeConnectorState(state);
  await heartbeatOrExit(state, 'connected');
  console.log(`Watching ${state.selectedProfiles?.length ?? 0} Hermes profile(s). AIFlows reads Hermes data read-only.`);
  console.log(state.syncRecentHistory ? 'Syncing recent completed history, then watching for new Flows.' : 'Watching only new completed Flows.');

  while (true) {
    state = (await readConnectorState()) ?? state;
    const result = await syncOnce(state);
    state = result.state;
    await writeConnectorState(state);
    await heartbeatOrExit(state, result.synced > 0 ? 'syncing' : 'connected');
    if (parsed.once) break;
    await sleep(POLL_INTERVAL_MS);
  }

  return 0;
}

async function ensureHermesSelection(state: ConnectorState, parsed: ParsedArgs): Promise<ConnectorState> {
  if (state.selectedProfiles?.length) return state;
  const discovered = discoverHermes(parsed.hermesHome ?? state.hermesHome);
  if (!discovered) {
    throw new Error('No Hermes data found. Re-run with --hermes-home /path/to/.hermes if Hermes uses a custom location.');
  }

  const selectedProfiles = parsed.yes ? discovered.profiles : await promptProfiles(discovered.profiles);
  const syncRecentHistory = parsed.yes ? true : await promptYesNo('Sync recent history now? Default is yes, latest 20 completed Flows per profile.');
  return { ...state, hermesHome: discovered.home, selectedProfiles, syncRecentHistory };
}

async function promptProfiles(profiles: SelectedHermesProfile[]): Promise<SelectedHermesProfile[]> {
  if (profiles.length === 1) return profiles;
  console.log('Hermes profiles found:');
  profiles.forEach((profile, index) => console.log(`${index + 1}. ${profile.label} (${profile.profileType})`));
  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question('Choose profiles to sync (comma-separated numbers, Enter for all): ')).trim();
    if (!answer) return profiles;
    const selected = new Set(answer.split(',').map((part) => Number(part.trim()) - 1).filter((index) => Number.isInteger(index) && index >= 0 && index < profiles.length));
    return profiles.filter((_, index) => selected.has(index));
  } finally {
    rl.close();
  }
}

async function promptYesNo(question: string): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question(`${question} [Y/n] `)).trim().toLowerCase();
    return answer === '' || answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}

async function syncOnce(state: ConnectorState): Promise<{ state: ConnectorState; synced: number }> {
  let current = state;
  let synced = 0;
  const syncedIds = new Set(current.syncedFlowIds ?? []);
  for (const profile of current.selectedProfiles ?? []) {
    const flows = readCompletedFlows(profile, current.syncRecentHistory ? 20 : 5).reverse();
    for (const flow of flows) {
      if (syncedIds.has(flow.externalId)) continue;
      try {
        await uploadFlows({ apiBaseUrl: current.apiBaseUrl, connectorToken: current.connectorToken, payload: { flows: [flow] } });
        current = clearFailedUpload(markFlowSynced(current, flow.externalId), flow.externalId);
        syncedIds.add(flow.externalId);
        synced += 1;
        console.log(`Synced Flow: ${flow.title}`);
      } catch (error) {
        if (error instanceof ConnectorApiError && (error.status === 401 || error.status === 404)) {
          throw new Error('Connector credentials were revoked or the Integration was deleted. Create a fresh Hermes Integration and reconnect.');
        }
        current = recordFailedUpload(current, flow.externalId, profile.id, error instanceof Error ? error.message : 'Upload failed');
      }
    }
  }
  return { state: { ...current, syncRecentHistory: false }, synced };
}

async function heartbeatOrExit(state: ConnectorState, status: 'connected' | 'syncing' | 'error') {
  try {
    await sendHeartbeat({ apiBaseUrl: state.apiBaseUrl, connectorToken: state.connectorToken, status });
  } catch (error) {
    if (error instanceof ConnectorApiError && (error.status === 401 || error.status === 404)) {
      throw new Error('Connector credentials were revoked or the Integration was deleted. Exiting.');
    }
    throw error;
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command = null, ...rest] = argv;
  let token: string | null = null;
  let apiBaseUrl: string | undefined;
  let hermesHome: string | undefined;
  let once = false;
  let yes = false;

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value === '--token') {
      token = rest[index + 1] ?? null;
      index += 1;
    } else if (value === '--api-base-url') {
      apiBaseUrl = rest[index + 1] ?? undefined;
      index += 1;
    } else if (value === '--hermes-home') {
      hermesHome = rest[index + 1] ?? undefined;
      index += 1;
    } else if (value === '--once') {
      once = true;
    } else if (value === '--yes' || value === '-y') {
      yes = true;
    }
  }

  return { command, token, apiBaseUrl, hermesHome, once, yes };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printUsage() {
  console.log('Usage:');
  console.log('  aiflows-connector connect --token <pairing-token> [--api-base-url <url>]');
  console.log('  aiflows-connector detect [--hermes-home <path>]');
  console.log('  aiflows-connector run [--hermes-home <path>] [--once] [--yes]');
}

const isMainModule = import.meta.url === new URL(process.argv[1], 'file:').href;

if (isMainModule) {
  const exitCode = await runCli();
  process.exit(exitCode);
}
