import { resolve } from "node:path";

import { createApp } from "./app.js";

const PORT = Number(process.env.PORT || 3417);
const HERMES_PROFILES_DIR =
  process.env.HERMES_PROFILES_DIR || resolve(process.env.HOME || "/root", ".hermes/profiles");

async function main() {
  let betterSqlite3: typeof import("better-sqlite3") | undefined;
  try {
    betterSqlite3 = (await import("better-sqlite3")).default;
  } catch {
    console.warn("better-sqlite3 not available, falling back to node:sqlite");
  }

  const app = createApp({
    profilesDir: HERMES_PROFILES_DIR,
    openDb: (dbPath: string) => {
      if (betterSqlite3) {
        return betterSqlite3(dbPath, { readonly: true });
      }
      throw new Error(
        "No SQLite library available. Install better-sqlite3 or use Node.js 22.5+"
      );
    },
  });

  app.listen(PORT, () => {
    console.log(`AIFlows backend listening on http://127.0.0.1:${PORT}`);
    console.log(`Hermes profiles directory: ${HERMES_PROFILES_DIR}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
