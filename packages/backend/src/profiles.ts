import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface Profile {
  id: string;
  label: string;
  hasDb: boolean;
}

export function discoverProfiles(profilesDir: string): Profile[] {
  if (!existsSync(profilesDir)) {
    return [];
  }

  const entries = readdirSync(profilesDir, { withFileTypes: true });
  const profiles: Profile[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dbPath = join(profilesDir, entry.name, "state.db");
    profiles.push({
      id: entry.name,
      label: entry.name,
      hasDb: existsSync(dbPath),
    });
  }

  return profiles.sort((a, b) => a.id.localeCompare(b.id));
}

export function getProfileDbPath(profilesDir: string, profileId: string): string | null {
  const dbPath = join(profilesDir, profileId, "state.db");
  if (!existsSync(dbPath)) return null;
  return dbPath;
}
