import { pairConnector } from './api.js';
import { writeConnectorState } from './state.js';

interface ParsedArgs {
  command: string | null;
  token: string | null;
  apiBaseUrl?: string;
}

export async function runCli(argv = process.argv.slice(2)): Promise<number> {
  const parsed = parseArgs(argv);

  if (parsed.command !== 'connect') {
    printUsage();
    return parsed.command === 'help' ? 0 : 1;
  }

  if (!parsed.token) {
    console.error('Missing pairing token. Use: aiflows-connector connect --token <pairing-token>');
    return 1;
  }

  try {
    const { apiBaseUrl, response } = await pairConnector({
      token: parsed.token,
      apiBaseUrl: parsed.apiBaseUrl,
    });

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
    console.log('Next step: keep this connector on the same machine/VPS as Hermes for sync commands.');
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pairing failed.';
    console.error(`Pairing failed: ${message}`);
    console.error('If this integration was deleted or revoked, create a fresh Hermes Integration and run connect again.');
    return 1;
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command = null, ...rest] = argv;
  let token: string | null = null;
  let apiBaseUrl: string | undefined;

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value === '--token') {
      token = rest[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (value === '--api-base-url') {
      apiBaseUrl = rest[index + 1] ?? undefined;
      index += 1;
      continue;
    }
  }

  return { command, token, apiBaseUrl };
}

function printUsage() {
  console.log('Usage: aiflows-connector connect --token <pairing-token> [--api-base-url <url>]');
}

const isMainModule = import.meta.url === new URL(process.argv[1], 'file:').href;

if (isMainModule) {
  const exitCode = await runCli();
  process.exit(exitCode);
}
