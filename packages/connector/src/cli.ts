import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { pairConnector, sendHeartbeat, uploadFlows, ConnectorApiError } from './api.js';
import { discoverHermes, readCompletedFlows } from './hermes.js';
import {
  clearFailedUpload,
  getConnectorStatePath,
  markFlowSynced,
  readConnectorState,
  recordFailedUpload,
  writeConnectorState,
  type ConnectorState,
  type PendingRecentSync,
  type SelectedHermesProfile,
} from './state.js';

interface ParsedArgs {
  command: string | null;
  token: string | null;
  apiBaseUrl?: string;
  hermesHome?: string;
  once: boolean;
  yes: boolean;
  colorMode: 'auto' | 'always' | 'never';
  profileAction?: 'add' | 'remove';
  profileName?: string;
  recent?: number;
  noHistory: boolean;
}

const POLL_INTERVAL_MS = 5000;

type StyleName = 'bold' | 'dim' | 'success' | 'warning' | 'error' | 'command';

type Output = ReturnType<typeof createOutput>;

export async function runCli(argv = process.argv.slice(2)): Promise<number> {
  const parsed = parseArgs(argv);
  const out = createOutput(parsed.colorMode);

  try {
    if (parsed.command === 'connect') return await runConnect(parsed, out);
    if (parsed.command === 'setup') return await runSetup(parsed, out);
    if (parsed.command === 'detect') return await runDetect(parsed, out);
    if (parsed.command === 'run') return await runConnector(parsed, out);
    if (parsed.command === 'profiles') return await runProfiles(parsed, out);
    if (parsed.command === 'status') return await runStatus(parsed, out);
    if (parsed.command === 'config') return await runConfig(out);
    if (parsed.command === 'doctor') return await runDoctor(parsed, out);
    if (parsed.command === 'tldr') return printTldr(out);
    printHelp(out);
    return parsed.command === null || parsed.command === 'help' ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? friendlyStateError(error) : 'Connector failed.';
    console.error(out.error(`✗ ${message}`));
    return 1;
  }
}

async function runConnect(parsed: ParsedArgs, out: Output): Promise<number> {
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

  console.log(out.success('✓ Connected to Hosted AIFlows'));
  console.log(`Integration: ${response.integration.name} (${response.integration.provider})`);
  console.log(`State saved to: ${statePath}`);
  console.log(`Next step: run ${out.command('aiflows-connector setup --token <token>')} for guided setup or ${out.command('aiflows-connector run')}.`);
  return 0;
}

async function runSetup(parsed: ParsedArgs, out: Output): Promise<number> {
  if (!parsed.token) {
    console.error('Missing pairing token. Use: aiflows-connector setup --token <pairing-token>');
    return 1;
  }

  console.log(out.bold('AIFlows Connector'));
  console.log('');

  const { apiBaseUrl, response } = await pairConnector({ token: parsed.token, apiBaseUrl: parsed.apiBaseUrl });
  console.log(out.success('✓ Connected to Hosted AIFlows'));

  const discovered = discoverHermes(parsed.hermesHome);
  if (!discovered) {
    const statePath = await writeConnectorState({
      apiBaseUrl,
      connectorToken: response.connectorToken,
      integrationId: response.integration.id,
      workspaceId: response.integration.workspaceId,
      integrationName: response.integration.name,
      provider: response.integration.provider,
      pairedAt: new Date().toISOString(),
    });
    console.log(out.warning('! Hermes was not found automatically.'));
    console.log(`State saved to: ${statePath}`);
    console.log(`Re-run with ${out.command('aiflows-connector setup --token <token> --hermes-home /path/to/.hermes')} or inspect with ${out.command('aiflows-connector doctor')}.`);
    return 1;
  }

  console.log(out.success(`✓ Found Hermes at ${discovered.home}`));
  const selectedProfiles = parsed.yes ? discovered.profiles : await promptProfiles(discovered.profiles);
  const syncRecentHistory = parsed.yes ? true : await promptYesNo('Sync recent history? Default is yes, latest 20 completed Flows per profile.');
  const pendingRecentSyncs = syncRecentHistory ? selectedProfiles.map((profile) => queueRecent(profile.id, 20)) : [];
  const state: ConnectorState = {
    apiBaseUrl,
    connectorToken: response.connectorToken,
    integrationId: response.integration.id,
    workspaceId: response.integration.workspaceId,
    integrationName: response.integration.name,
    provider: response.integration.provider,
    pairedAt: new Date().toISOString(),
    hermesHome: discovered.home,
    selectedProfiles,
    syncRecentHistory,
    pendingRecentSyncs,
  };
  const statePath = await writeConnectorState(state);
  console.log(out.success('✓ Setup complete'));
  console.log(out.dim(`State saved to: ${statePath}`));
  printInstalledCommandTips(out);

  const startNow = parsed.yes ? true : await promptYesNo('Start watching Hermes now?');
  if (startNow) {
    console.log('');
    console.log('Starting the foreground sync loop. Stop it with Ctrl+C.');
    console.log('Start it again later with:');
    console.log(`  ${out.command('aiflows-connector run')}`);
    console.log(`  ${out.command('~/.aiflows/bin/aiflows-connector run')} if the command is not on PATH yet.`);
    console.log('');
    return await runConnector({ ...parsed, once: false, yes: true }, out);
  }

  printStartLater(out);
  return 0;
}

async function runDetect(parsed: ParsedArgs, out: Output): Promise<number> {
  const discovered = discoverHermes(parsed.hermesHome);
  if (!discovered) {
    console.error('No Hermes data found. Re-run with --hermes-home /path/to/.hermes if Hermes uses a custom location.');
    return 1;
  }

  console.log(out.bold(`Hermes home: ${discovered.home}`));
  for (const profile of discovered.profiles) {
    console.log(`- ${profile.label} (${profile.profileType}) ${out.dim(profile.dbPath)}`);
  }
  return 0;
}

async function runConnector(parsed: ParsedArgs, out: Output): Promise<number> {
  let state = await readStateKindly();
  if (!state) {
    console.error('Connector is not set up yet. Run the setup command from Hosted AIFlows: aiflows-connector setup --token <token>');
    return 1;
  }

  state = await ensureHermesSelection(state, parsed);
  await writeConnectorState(state);
  await heartbeatOrExit(state, 'connected');
  console.log(`Watching ${state.selectedProfiles?.length ?? 0} Hermes profile(s). AIFlows reads Hermes data read-only.`);
  console.log(hasPendingRecentSyncs(state) ? 'Syncing queued recent history, then watching for new Flows.' : 'Watching new completed Flows.');
  if (!parsed.once) {
    console.log('Press Ctrl+C to stop. Restart later with: aiflows-connector run');
    console.log('If that command is not found, use: ~/.aiflows/bin/aiflows-connector run');
  }

  while (true) {
    state = (await readStateKindly()) ?? state;
    const result = await syncOnce(state);
    state = result.state;
    await writeConnectorState(state);
    await heartbeatOrExit(state, result.synced > 0 ? 'syncing' : 'connected');
    if (parsed.once) break;
    await sleep(POLL_INTERVAL_MS);
  }

  return 0;
}

async function runProfiles(parsed: ParsedArgs, out: Output): Promise<number> {
  if (parsed.profileAction === 'add') return await addProfile(parsed, out);
  if (parsed.profileAction === 'remove') return await removeProfile(parsed, out);

  const state = await readStateKindly();
  const discovered = discoverHermes(parsed.hermesHome ?? state?.hermesHome);
  const selected = new Set(state?.selectedProfiles?.map((profile) => profile.id) ?? []);

  if (!discovered) {
    console.log(out.warning('! No Hermes profiles found. Use --hermes-home /path/to/.hermes if Hermes uses a custom location.'));
    if (!state) printSetupHint(out);
    return state ? 0 : 1;
  }

  console.log(out.bold(`Hermes home: ${discovered.home}`));
  if (!state) {
    console.log(out.warning('! Connector is not set up yet — local detection preview only.'));
  }
  console.log('');
  console.log(out.bold('Profiles:'));
  for (const profile of discovered.profiles) {
    const isSelected = selected.has(profile.id);
    console.log(`  ${isSelected ? out.success('✓') : '○'} ${profile.label.padEnd(12)} ${isSelected ? 'syncing' : 'not synced'}`);
  }
  console.log('');
  console.log(out.bold('Commands:'));
  console.log(`  ${out.command('aiflows-connector profiles add <profile>')}`);
  console.log(`  ${out.command('aiflows-connector profiles remove <profile>')}`);
  return 0;
}

async function addProfile(parsed: ParsedArgs, out: Output): Promise<number> {
  const state = await requireState(out, 'profiles add');
  if (!state) return 1;
  const profileName = parsed.profileName;
  if (!profileName) {
    console.error('Missing profile name. Use: aiflows-connector profiles add <profile>');
    return 1;
  }

  const discovered = discoverHermes(parsed.hermesHome ?? state.hermesHome);
  if (!discovered) {
    console.error(`Profile not found: ${profileName}. Run aiflows-connector profiles to see detected profiles.`);
    return 1;
  }
  const profile = discovered.profiles.find((item) => item.id === profileName || item.label === profileName);
  if (!profile) {
    console.error(`Profile not found: ${profileName}. Run aiflows-connector profiles to see detected profiles.`);
    return 1;
  }

  const selectedProfiles = [...(state.selectedProfiles ?? [])];
  const exists = selectedProfiles.some((item) => item.id === profile.id);
  if (!exists) selectedProfiles.push(profile);

  let pendingRecentSyncs = [...(state.pendingRecentSyncs ?? [])];
  let syncRecentHistory = state.syncRecentHistory ?? false;
  if (parsed.recent !== undefined) {
    pendingRecentSyncs = upsertPendingRecent(pendingRecentSyncs, profile.id, parsed.recent);
    syncRecentHistory = true;
  } else if (parsed.noHistory) {
    // Future Flows only.
  } else if (!exists && process.stdout.isTTY) {
    const syncRecent = await promptYesNo('Sync recent history for this profile? Default is yes, latest 20 completed Flows.');
    if (syncRecent) {
      pendingRecentSyncs = upsertPendingRecent(pendingRecentSyncs, profile.id, 20);
      syncRecentHistory = true;
    }
  } else if (exists) {
    console.log('Profile is already selected. Use --recent 20 to queue recent history for it.');
    return 0;
  }

  await writeConnectorState({ ...state, hermesHome: discovered.home, selectedProfiles: selectedProfiles.sort((a, b) => a.id.localeCompare(b.id)), pendingRecentSyncs, syncRecentHistory });
  if (exists && parsed.recent !== undefined) {
    console.log(out.success(`✓ Queued latest ${parsed.recent} completed Flows for profile \`${profile.label}\`.`));
  } else if (exists) {
    console.log(`Profile \`${profile.label}\` is already selected.`);
  } else {
    console.log(out.success(`✓ Added profile \`${profile.label}\` for syncing.`));
    if (parsed.recent !== undefined) {
      console.log(`Queued latest ${parsed.recent} completed Flows for this profile.`);
    } else {
      console.log(parsed.noHistory ? 'Only future completed Flows will sync.' : 'Recent history will sync if queued, then future completed Flows will sync.');
    }
  }
  return 0;
}

async function removeProfile(parsed: ParsedArgs, out: Output): Promise<number> {
  const state = await requireState(out, 'profiles remove');
  if (!state) return 1;
  const profileName = parsed.profileName;
  if (!profileName) {
    console.error('Missing profile name. Use: aiflows-connector profiles remove <profile>');
    return 1;
  }

  const before = state.selectedProfiles ?? [];
  const selectedProfiles = before.filter((profile) => profile.id !== profileName && profile.label !== profileName);
  if (selectedProfiles.length === before.length) {
    console.log(`Profile \`${profileName}\` was not selected for syncing.`);
    return 0;
  }

  const pendingRecentSyncs = (state.pendingRecentSyncs ?? []).filter((item) => item.profileId !== profileName);
  await writeConnectorState({ ...state, selectedProfiles, pendingRecentSyncs });
  console.log(out.success(`Stopped syncing profile \`${profileName}\`.`));
  console.log('Previously synced Flows remain in Hosted AIFlows.');
  return 0;
}

async function runStatus(parsed: ParsedArgs, out: Output): Promise<number> {
  const state = await readStateKindly();
  if (!state) {
    printNotSetup(out);
    return 0;
  }

  console.log(out.bold('AIFlows Connector status'));
  printStateSummary(state, out);
  const discovered = discoverHermes(parsed.hermesHome ?? state.hermesHome);
  printDetectedProfiles(discovered, state, out);

  try {
    const response = await sendHeartbeat({ apiBaseUrl: state.apiBaseUrl, connectorToken: state.connectorToken, status: 'connected', message: 'status check' });
    console.log(out.success(`✓ Hosted AIFlows reachable — Integration status: ${response.integration.status}`));
  } catch (error) {
    console.log(out.warning('! Hosted AIFlows is unreachable right now — showing local state only.'));
    if (error instanceof Error) console.log(out.dim(error.message));
  }
  return 0;
}

async function runConfig(out: Output): Promise<number> {
  const state = await readStateKindly();
  console.log(out.bold('AIFlows Connector config'));
  console.log(`State file: ${getConnectorStatePath()}`);
  if (!state) {
    printNotSetup(out);
    return 0;
  }
  printStateSummary(state, out, { includeFailures: true });
  if (hasPendingRecentSyncs(state)) {
    console.log(`Pending recent syncs: ${state.pendingRecentSyncs?.map((item) => `${item.profileId} (${item.count})`).join(', ')}`);
  } else {
    console.log('Pending recent syncs: none');
  }
  return 0;
}

async function runDoctor(parsed: ParsedArgs, out: Output): Promise<number> {
  console.log(out.bold('AIFlows Connector doctor'));
  console.log(out.dim('Network check: Hosted AIFlows will be contacted if the Connector is paired.'));
  const state = await readStateKindly();

  if (!state) {
    console.log(out.warning('! Connector not paired yet'));
    printSetupHint(out);
  } else {
    console.log(out.success('✓ Connector paired'));
    try {
      await sendHeartbeat({ apiBaseUrl: state.apiBaseUrl, connectorToken: state.connectorToken, status: 'connected', message: 'doctor check' });
      console.log(out.success('✓ API reachable'));
      console.log(out.success('✓ Connector token accepted'));
    } catch (error) {
      console.log(out.warning('! API reachable/token check failed'));
      if (error instanceof Error) console.log(out.dim(error.message));
    }
  }

  const discovered = discoverHermes(parsed.hermesHome ?? state?.hermesHome);
  if (discovered) {
    console.log(out.success(`✓ Hermes home found: ${discovered.home}`));
    console.log(out.success(`✓ Hermes profiles found: ${discovered.profiles.map((profile) => profile.label).join(', ')}`));
    for (const profile of state?.selectedProfiles ?? []) {
      try {
        await access(profile.dbPath, constants.R_OK);
        console.log(out.success(`✓ Selected profile DB readable: ${profile.label}`));
      } catch {
        console.log(out.error(`✗ Selected profile DB not readable: ${profile.label}`));
      }
    }
  } else {
    console.log(out.warning('! Hermes home not found'));
  }

  try {
    const statePath = getConnectorStatePath();
    try {
      await access(join(statePath, '..'), constants.W_OK);
    } catch {
      await access(homedir(), constants.W_OK);
    }
    console.log(out.success(`✓ Local state writable: ${statePath}`));
  } catch {
    console.log(out.error(`✗ Local state not writable: ${getConnectorStatePath()}`));
  }

  if (state?.failedUploads?.length) {
    console.log(out.warning(`! Failed uploads pending: ${state.failedUploads.length}`));
  } else {
    console.log(out.success('✓ No failed uploads pending'));
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
  return {
    ...state,
    hermesHome: discovered.home,
    selectedProfiles,
    syncRecentHistory,
    pendingRecentSyncs: syncRecentHistory ? selectedProfiles.map((profile) => queueRecent(profile.id, 20)) : state.pendingRecentSyncs,
  };
}

async function promptProfiles(profiles: SelectedHermesProfile[]): Promise<SelectedHermesProfile[]> {
  if (profiles.length === 1) return profiles;
  console.log('Which profiles should AIFlows sync?');
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
  const pendingByProfile = new Map((current.pendingRecentSyncs ?? []).map((item) => [item.profileId, item.count]));
  const completedPending = new Set<string>();

  for (const profile of current.selectedProfiles ?? []) {
    const limit = pendingByProfile.get(profile.id) ?? 5;
    const flows = readCompletedFlows(profile, limit).reverse();
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
    if (pendingByProfile.has(profile.id)) completedPending.add(profile.id);
  }
  return { state: { ...current, pendingRecentSyncs: (current.pendingRecentSyncs ?? []).filter((item) => !completedPending.has(item.profileId)), syncRecentHistory: false }, synced };
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
  const [command = null, maybeActionOrName, maybeName, ...restArgs] = argv;
  let rest = command === 'profiles' && (maybeActionOrName === 'add' || maybeActionOrName === 'remove') ? restArgs : [maybeActionOrName, maybeName, ...restArgs].filter((value): value is string => value !== undefined);
  let profileAction: ParsedArgs['profileAction'];
  let profileName: string | undefined;
  if (command === 'profiles' && (maybeActionOrName === 'add' || maybeActionOrName === 'remove')) {
    profileAction = maybeActionOrName;
    profileName = maybeName;
  }

  let token: string | null = null;
  let apiBaseUrl: string | undefined;
  let hermesHome: string | undefined;
  let once = false;
  let yes = false;
  let colorMode: ParsedArgs['colorMode'] = 'auto';
  let recent: number | undefined;
  let noHistory = false;

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
    } else if (value === '--recent') {
      recent = Number(rest[index + 1]);
      index += 1;
    } else if (value === '--no-history') {
      noHistory = true;
    } else if (value === '--once') {
      once = true;
    } else if (value === '--yes' || value === '-y') {
      yes = true;
    } else if (value === '--color') {
      colorMode = 'always';
    } else if (value === '--no-color') {
      colorMode = 'never';
    }
  }

  if (recent !== undefined && (!Number.isInteger(recent) || recent < 1)) recent = undefined;
  return { command, token, apiBaseUrl, hermesHome, once, yes, colorMode, profileAction, profileName, recent, noHistory };
}

function createOutput(colorMode: ParsedArgs['colorMode']) {
  const enabled = colorMode === 'always' || (colorMode === 'auto' && (Boolean(process.env.FORCE_COLOR) || (process.stdout.isTTY && !process.env.NO_COLOR)));
  const codes: Record<StyleName, [number, number]> = {
    bold: [1, 22],
    dim: [2, 22],
    success: [32, 39],
    warning: [33, 39],
    error: [31, 39],
    command: [36, 39],
  };
  const style = (name: StyleName, value: string) => (enabled ? `\u001b[${codes[name][0]}m${value}\u001b[${codes[name][1]}m` : value);
  return {
    bold: (value: string) => style('bold', value),
    dim: (value: string) => style('dim', value),
    success: (value: string) => style('success', value),
    warning: (value: string) => style('warning', value),
    error: (value: string) => style('error', value),
    command: (value: string) => style('command', value),
  };
}

function printHelp(out: Output): number {
  console.log(out.bold('AIFlows Connector'));
  console.log('');
  printInstalledCommandTips(out);
  console.log('Usage:');
  console.log(`  ${out.command('aiflows-connector setup --token <pairing-token> [--api-base-url <url>] [--hermes-home <path>] [--yes]')}`);
  console.log(`  ${out.command('aiflows-connector connect --token <pairing-token> [--api-base-url <url>]')}`);
  console.log(`  ${out.command('aiflows-connector run [--hermes-home <path>] [--once] [--yes]')}`);
  console.log(`  ${out.command('aiflows-connector detect [--hermes-home <path>]')}`);
  console.log(`  ${out.command('aiflows-connector status')}`);
  console.log(`  ${out.command('aiflows-connector profiles')}`);
  console.log(`  ${out.command('aiflows-connector profiles add <name> [--recent <count>] [--no-history]')}`);
  console.log(`  ${out.command('aiflows-connector profiles remove <name>')}`);
  console.log(`  ${out.command('aiflows-connector config')}`);
  console.log(`  ${out.command('aiflows-connector doctor')}`);
  console.log(`  ${out.command('aiflows-connector tldr')}`);
  console.log('');
  console.log('Color: use --color, --no-color, NO_COLOR=1, or FORCE_COLOR=1.');
  return 0;
}

function printTldr(out: Output): number {
  console.log(out.bold('AIFlows Connector — common commands'));
  console.log('');
  printInstalledCommandTips(out);
  console.log('First setup:');
  console.log(`  ${out.command('aiflows-connector setup --token <token>')}`);
  console.log('');
  console.log('Start syncing:');
  console.log(`  ${out.command('aiflows-connector run')}`);
  console.log('');
  console.log('Check health:');
  console.log(`  ${out.command('aiflows-connector status')}`);
  console.log(`  ${out.command('aiflows-connector doctor')}`);
  console.log('');
  console.log('Manage profiles:');
  console.log(`  ${out.command('aiflows-connector profiles')}`);
  console.log(`  ${out.command('aiflows-connector profiles add <name>')}`);
  console.log(`  ${out.command('aiflows-connector profiles add <name> --recent 20')}`);
  console.log(`  ${out.command('aiflows-connector profiles remove <name>')}`);
  return 0;
}

function printStartLater(out: Output) {
  console.log('');
  console.log('Start later with:');
  console.log(`  ${out.command('aiflows-connector run')}`);
  console.log(`  ${out.command('~/.aiflows/bin/aiflows-connector run')} if the command is not on PATH yet.`);
  console.log('');
  console.log('Useful commands:');
  console.log(`  ${out.command('aiflows-connector status')}`);
  console.log(`  ${out.command('aiflows-connector profiles')}`);
  console.log(`  ${out.command('aiflows-connector tldr')}`);
}

function printInstalledCommandTips(out: Output) {
  console.log('Installed command names:');
  console.log(`  ${out.command('aiflows-connector tldr')}  quick command cheat sheet`);
  console.log(`  ${out.command('aiflows-connector help')}  full help`);
  console.log(`  ${out.command('aiflows-connector run')}   start syncing`);
  console.log(`  ${out.command('aiflows tldr')}            shorter alias, if installed`);
  console.log('If your shell says command not found, use the full path:');
  console.log(`  ${out.command('~/.aiflows/bin/aiflows-connector tldr')}`);
  console.log(`  ${out.command('~/.aiflows/bin/aiflows-connector run')}`);
  console.log('');
}

function printNotSetup(out: Output) {
  console.log('Connector is not set up yet.');
  printSetupHint(out);
}

function printSetupHint(out: Output) {
  console.log('Run the setup command from Hosted AIFlows:');
  console.log(`  ${out.command('aiflows-connector setup --token <token>')}`);
}

function printStateSummary(state: ConnectorState, out: Output, options: { includeFailures?: boolean } = {}) {
  console.log(`Integration: ${state.integrationName} (${state.provider})`);
  console.log(`Integration ID: ${state.integrationId}`);
  console.log(`API base URL: ${state.apiBaseUrl}`);
  console.log(`Hermes home: ${state.hermesHome ?? 'not configured yet'}`);
  console.log(`Selected profiles: ${state.selectedProfiles?.map((profile) => profile.label).join(', ') || 'none yet'}`);
  console.log(`Last sync: ${state.lastSyncAt ?? 'never'}`);
  if (options.includeFailures || state.failedUploads?.length) {
    console.log(`Failed uploads: ${state.failedUploads?.length ?? 0}`);
    for (const failure of state.failedUploads ?? []) {
      console.log(out.dim(`  - ${failure.flowExternalId}: ${failure.lastError}`));
    }
  }
}

function printDetectedProfiles(discovered: ReturnType<typeof discoverHermes>, state: ConnectorState, out: Output) {
  if (!discovered) {
    console.log(out.warning('! Hermes profiles could not be detected.'));
    return;
  }
  const selected = new Set(state.selectedProfiles?.map((profile) => profile.id) ?? []);
  console.log(`Detected profiles: ${discovered.profiles.map((profile) => `${selected.has(profile.id) ? '✓' : '○'} ${profile.label}`).join(', ')}`);
}

async function requireState(out: Output, commandName: string): Promise<ConnectorState | null> {
  const state = await readStateKindly();
  if (state) return state;
  console.error(`${commandName} requires setup first.`);
  printSetupHint(out);
  return null;
}

async function readStateKindly(): Promise<ConnectorState | null> {
  try {
    return await readConnectorState();
  } catch (error) {
    throw new Error(friendlyStateError(error instanceof Error ? error : new Error('Invalid connector state.')));
  }
}

function friendlyStateError(error: Error): string {
  if (error instanceof SyntaxError || error.message.includes('JSON')) {
    return `Local connector state is not readable JSON: ${getConnectorStatePath()}. Back it up, then rerun setup from Hosted AIFlows.`;
  }
  return error.message;
}

function queueRecent(profileId: string, count: number): PendingRecentSync {
  return { profileId, count, queuedAt: new Date().toISOString() };
}

function upsertPendingRecent(items: PendingRecentSync[], profileId: string, count: number): PendingRecentSync[] {
  return [...items.filter((item) => item.profileId !== profileId), queueRecent(profileId, count)].sort((a, b) => a.profileId.localeCompare(b.profileId));
}

function hasPendingRecentSyncs(state: ConnectorState): boolean {
  return Boolean(state.pendingRecentSyncs?.length);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const isMainModule = import.meta.url === new URL(process.argv[1], 'file:').href;

if (isMainModule) {
  const exitCode = await runCli();
  process.exit(exitCode);
}
