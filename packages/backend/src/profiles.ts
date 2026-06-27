import { readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

export const DEFAULT_AGENT_ID = "default";
export const DEFAULT_AGENT_LABEL = "default";

export interface Profile {
  id: string;
  label: string;
  hasDb: boolean;
}

function hermesRoot(profilesDir: string): string {
  return resolve(profilesDir, "..");
}

export function discoverProfiles(profilesDir: string): Profile[] {
  const profiles: Profile[] = [];

  if (existsSync(profilesDir)) {
    const entries = readdirSync(profilesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dbPath = join(profilesDir, entry.name, "state.db");
      profiles.push({
        id: entry.name,
        label: entry.name,
        hasDb: existsSync(dbPath),
      });
    }
  }

  const rootDb = join(hermesRoot(profilesDir), "state.db");
  if (existsSync(rootDb)) {
    profiles.push({
      id: DEFAULT_AGENT_ID,
      label: DEFAULT_AGENT_LABEL,
      hasDb: true,
    });
  }

  return profiles.sort((a, b) => a.id.localeCompare(b.id));
}

export function getProfileDbPath(profilesDir: string, profileId: string): string | null {
  if (profileId === DEFAULT_AGENT_ID) {
    const dbPath = join(hermesRoot(profilesDir), "state.db");
    if (!existsSync(dbPath)) return null;
    return dbPath;
  }

  const dbPath = join(profilesDir, profileId, "state.db");
  if (!existsSync(dbPath)) return null;
  return dbPath;
}
