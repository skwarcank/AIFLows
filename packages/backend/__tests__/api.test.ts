import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createApp } from "../src/app.js";
import { discoverProfiles, getProfileDbPath } from "../src/profiles.js";

function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      source TEXT,
      started_at INTEGER,
      ended_at INTEGER,
      title TEXT
    );
    CREATE TABLE messages (
      id INTEGER PRIMARY KEY,
      session_id TEXT,
      role TEXT,
      content TEXT,
      timestamp INTEGER,
      finish_reason TEXT,
      tool_calls TEXT,
      tool_call_id TEXT,
      tool_name TEXT,
      active INTEGER,
      model TEXT
    );
  `);
}

function insertFlow(db: Database.Database, sessionIndex: number, model = "gpt-4o-mini") {
  const sessionId = `sess-${sessionIndex}`;
  const base = 1_700_000_000 + sessionIndex * 1000;
  db.prepare(
    `INSERT INTO sessions (id, source, started_at, ended_at, title) VALUES (?, ?, ?, ?, ?)`
  ).run(sessionId, sessionIndex % 2 === 0 ? "telegram" : "cli", base, base + 60, `Prompt ${sessionIndex}`);

  db.prepare(
    `INSERT INTO messages (id, session_id, role, content, timestamp, finish_reason, tool_calls, tool_call_id, tool_name, active, model)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(sessionIndex * 10 + 1, sessionId, "user", `Prompt ${sessionIndex}`, base, null, null, null, null, 1, null);

  db.prepare(
    `INSERT INTO messages (id, session_id, role, content, timestamp, finish_reason, tool_calls, tool_call_id, tool_name, active, model)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    sessionIndex * 10 + 2,
    sessionId,
    "assistant",
    null,
    base + 10,
    "tool_calls",
    JSON.stringify([
      {
        id: `call-${sessionIndex}`,
        function: { name: "read_file", arguments: JSON.stringify({ path: `/tmp/file-${sessionIndex}.md` }) },
      },
    ]),
    null,
    null,
    1,
    model
  );

  db.prepare(
    `INSERT INTO messages (id, session_id, role, content, timestamp, finish_reason, tool_calls, tool_call_id, tool_name, active, model)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    sessionIndex * 10 + 3,
    sessionId,
    "tool",
    JSON.stringify({ ok: true }),
    base + 20,
    null,
    null,
    `call-${sessionIndex}`,
    "read_file",
    1,
    null
  );

  db.prepare(
    `INSERT INTO messages (id, session_id, role, content, timestamp, finish_reason, tool_calls, tool_call_id, tool_name, active, model)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(sessionIndex * 10 + 4, sessionId, "assistant", `Answer ${sessionIndex}`, base + 30, "stop", null, null, null, 1, model);

  return sessionId;
}

function createHermesTree() {
  const root = mkdtempSync(join(tmpdir(), "aiflows-api-"));
  const defaultDbPath = join(root, "state.db");
  const defaultDb = new Database(defaultDbPath);
  createSchema(defaultDb);
  for (let i = 1; i <= 25; i += 1) insertFlow(defaultDb, i);
  defaultDb.close();

  const profileDir = join(root, "profiles", "writer");
  mkdirSync(profileDir, { recursive: true });
  const writerDb = new Database(join(profileDir, "state.db"));
  createSchema(writerDb);
  insertFlow(writerDb, 101, "claude-3.5-sonnet");
  writerDb.close();

  mkdirSync(join(root, "profiles", "empty"), { recursive: true });
  return root;
}

function startServer(profilesDir: string) {
  const app = createApp({
    profilesDir: join(profilesDir, "profiles"),
    openDb: (dbPath) => new Database(dbPath, { readonly: true }),
  });
  const server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start test server");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    baseUrl,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

describe("Hermes profile discovery", () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = createHermesTree();
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("includes named profiles and the default setup when available", () => {
    const profiles = discoverProfiles(join(rootDir, "profiles"));
    expect(profiles.map((profile) => profile.id)).toEqual(["default", "empty", "writer"]);
    expect(getProfileDbPath(join(rootDir, "profiles"), "default")).toBe(join(rootDir, "state.db"));
    expect(getProfileDbPath(join(rootDir, "profiles"), "writer")).toBe(join(rootDir, "profiles", "writer", "state.db"));
  });
});

describe("adapter API contract", () => {
  let rootDir: string;
  let server: Awaited<ReturnType<typeof startServer>>;

  beforeEach(() => {
    rootDir = createHermesTree();
    server = startServer(rootDir);
  });

  afterEach(async () => {
    await server.close();
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("lists Hermes as the working adapter", async () => {
    const res = await fetch(`${server.baseUrl}/api/adapters`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { adapters: Array<{ id: string; profileCount: number }> };
    expect(body.adapters).toEqual([{ id: "hermes", name: "Hermes", status: "available", profileCount: 2 }]);
  });

  it("returns Hermes profiles including the default setup", async () => {
    const res = await fetch(`${server.baseUrl}/api/adapters/hermes/profiles`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { profiles: Array<{ id: string; label: string }> };
    expect(body.profiles.map((profile) => profile.id)).toEqual(["default", "writer"]);
    expect(body.profiles[0].label).toBe("default");
  });

  it("paginates Flows and returns a detailed Flow replay", async () => {
    const listRes = await fetch(`${server.baseUrl}/api/adapters/hermes/profiles/default/flows?limit=20&offset=0`);
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as {
      flows: Array<{ id: string; promptPreview: string; model: string; stepCount: number }>;
      hasMore: boolean;
      total: number;
    };
    expect(listBody.flows).toHaveLength(20);
    expect(listBody.hasMore).toBe(true);
    expect(listBody.total).toBe(25);
    expect(listBody.flows[0].promptPreview).toContain("Prompt");
    expect(listBody.flows[0].model).toBe("gpt-4o-mini");

    const flowId = listBody.flows[0].id;
    const detailRes = await fetch(`${server.baseUrl}/api/adapters/hermes/profiles/default/flows/${encodeURIComponent(flowId)}`);
    expect(detailRes.status).toBe(200);
    const detailBody = (await detailRes.json()) as {
      flow: { id: string; steps: Array<{ type: string; summary: string; details?: Array<{ label: string; value: string }> }> };
    };
    expect(detailBody.flow.id).toBe(flowId);
    expect(detailBody.flow.steps[0].type).toBe("user_prompt");
    expect(detailBody.flow.steps[1].summary).toMatch(/Read file|Search files|Run terminal command|Use browser|Update memory|Manage skill/);
    expect(detailBody.flow.steps[1].details?.some((detail) => detail.label === "Path")).toBe(true);
  });

  it("returns clear errors for unknown profiles and flows", async () => {
    const profileRes = await fetch(`${server.baseUrl}/api/adapters/hermes/profiles/missing/flows`);
    expect(profileRes.status).toBe(404);
    const profileBody = (await profileRes.json()) as { error: string; message: string };
    expect(profileBody.error).toBe("Profile not found");

    const flowRes = await fetch(`${server.baseUrl}/api/adapters/hermes/profiles/default/flows/missing-flow`);
    expect(flowRes.status).toBe(404);
    const flowBody = (await flowRes.json()) as { error: string; message: string };
    expect(flowBody.error).toBe("Flow not found");
  });
});
