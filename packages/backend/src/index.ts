import express from "express";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { discoverProfiles, getProfileDbPath } from "./profiles.js";
import { readTracesForProfile } from "./trace-reader.js";

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

  function openDb(dbPath: string) {
    if (betterSqlite3) {
      return betterSqlite3(dbPath, { readonly: true });
    }
    throw new Error(
      "No SQLite library available. Install better-sqlite3 or use Node.js 22.5+"
    );
  }

  const app = express();

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/profiles", (_req, res) => {
    try {
      const profiles = discoverProfiles(HERMES_PROFILES_DIR);
      const result = profiles.map((p) => ({
        id: p.id,
        label: p.label,
        status: p.hasDb ? "available" : "no-database",
      }));
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: "Failed to discover profiles", message });
    }
  });

  app.get("/api/profiles/:id/traces", (req, res) => {
    try {
      const profileId = req.params.id;
      const dbPath = getProfileDbPath(HERMES_PROFILES_DIR, profileId);

      if (!dbPath) {
        res.status(404).json({
          error: "Profile not found",
          message: `No Hermes profile found with id '${profileId}'`,
        });
        return;
      }

      const db = openDb(dbPath);
      try {
        const traces = readTracesForProfile(db, {
          dbPath,
          profile: profileId,
        });
        const result = traces.map((t) => ({
          id: t.id,
          profile: t.profile,
          sessionId: t.sessionId,
          source: t.source,
          status: t.status,
          startedAt: t.startedAt,
          finishedAt: t.finishedAt,
          promptPreview: t.promptPreview,
          finalAnswerPreview: t.finalAnswerPreview,
        }));
        res.json(result);
      } finally {
        db.close();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: "Failed to read traces", message });
    }
  });

  app.get("/api/traces/:traceId", (req, res) => {
    try {
      const traceId = req.params.traceId;

      const profiles = discoverProfiles(HERMES_PROFILES_DIR);
      for (const profile of profiles) {
        if (!profile.hasDb) continue;
        const dbPath = getProfileDbPath(HERMES_PROFILES_DIR, profile.id);
        if (!dbPath) continue;

        const db = openDb(dbPath);
        try {
          const traces = readTracesForProfile(db, {
            dbPath,
            profile: profile.id,
          });
          const found = traces.find((t) => t.id === traceId);
          if (found) {
            res.json(found);
            return;
          }
        } finally {
          db.close();
        }
      }

      res.status(404).json({
        error: "Trace not found",
        message: `No trace found with id '${traceId}'`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: "Failed to read trace", message });
    }
  });

  const frontendDist = resolve(
    import.meta.dirname || ".",
    "..",
    "..",
    "frontend",
    "dist"
  );
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
  }

  if (existsSync(frontendDist)) {
    app.get("/", (_req, res) => {
      const html = readFileSync(join(frontendDist, "index.html"), "utf-8");
      res.type("html").send(html);
    });
  } else {
    app.get("/", (_req, res) => {
      res.type("html").send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>AIFlows</title></head>
<body>
  <h1>AIFlows</h1>
  <p>Backend is running. Start the frontend for the dashboard.</p>
  <ul>
    <li><a href="/health">/health</a></li>
    <li><a href="/api/profiles">/api/profiles</a></li>
  </ul>
</body>
</html>`);
    });
  }

  app.listen(PORT, () => {
    console.log(`AIFlows backend listening on http://127.0.0.1:${PORT}`);
    console.log(`Hermes profiles directory: ${HERMES_PROFILES_DIR}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
