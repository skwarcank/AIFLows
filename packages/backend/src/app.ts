import express from "express";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { discoverProfiles, getProfileDbPath } from "./profiles.js";
import { readTracesForProfile } from "./trace-reader.js";
import type {
  AdapterInfo,
  FlowDetail,
  FlowStep,
  FlowSummary,
  HermesProfileInfo,
  RunTrace,
} from "./types.js";

interface OpenDbHandle {
  close(): void;
}

export interface CreateAppOptions {
  profilesDir: string;
  openDb: (dbPath: string) => OpenDbHandle;
  frontendDist?: string;
}

function clampNumber(
  value: unknown,
  fallback: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): number {
  const raw = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, raw));
}

function jsonError(
  res: express.Response,
  status: number,
  error: string,
  message: string
): void {
  res.status(status).json({ error, message });
}

function truncate(text: string, max = 120): string {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function safeParse(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function pickFirstString(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  for (const key of keys) {
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return undefined;
}

function describeToolArgs(
  toolName: string | undefined,
  raw: unknown
): Array<{ label: string; value: string }> {
  let parsed = safeParse(raw);
  if (
    parsed &&
    typeof parsed === "object" &&
    "function" in parsed &&
    parsed.function &&
    typeof parsed.function === "object" &&
    "arguments" in parsed.function
  ) {
    parsed = safeParse((parsed.function as Record<string, unknown>).arguments);
  } else if (
    parsed &&
    typeof parsed === "object" &&
    "arguments" in parsed &&
    typeof (parsed as Record<string, unknown>).arguments === "string"
  ) {
    parsed = safeParse((parsed as Record<string, unknown>).arguments);
  }

  if (!parsed || typeof parsed !== "object") return [];

  const record = parsed as Record<string, unknown>;
  const details: Array<{ label: string; value: string }> = [];

  const path = pickFirstString(record, ["path", "filepath", "file", "target"]);
  const query = pickFirstString(record, ["query", "pattern", "search", "term"]);
  const command = pickFirstString(record, ["command", "cmd", "script"]);
  const url = pickFirstString(record, ["url", "href"]);
  const text = pickFirstString(record, ["text", "message", "content"]);
  const model = pickFirstString(record, ["model"]);
  const role = pickFirstString(record, ["role"]);
  const name = pickFirstString(record, ["title", "name"]);

  if (toolName === "read_file" || toolName === "search_files" || toolName === "glob" || toolName === "list_files") {
    if (path) details.push({ label: "Path", value: path });
    if (query) details.push({ label: "Query", value: query });
  }

  if (toolName === "write_file" || toolName === "patch" || toolName === "apply_patch") {
    if (path) details.push({ label: "Target", value: path });
    if (text) details.push({ label: "Content", value: truncate(text, 180) });
  }

  if (toolName === "terminal" || toolName === "shell" || toolName === "exec" || toolName === "command") {
    if (command) details.push({ label: "Command", value: command });
    if (path) details.push({ label: "Working directory", value: path });
  }

  if (toolName === "browser" || toolName === "browser_navigate" || toolName === "browser_click") {
    if (url) details.push({ label: "URL", value: url });
    if (name) details.push({ label: "Target", value: name });
  }

  if (toolName === "memory" || toolName === "skill_manage" || toolName === "skills") {
    if (name) details.push({ label: "Name", value: name });
    if (role) details.push({ label: "Target", value: role });
    if (text) details.push({ label: "Content", value: truncate(text, 180) });
  }

  if (model) {
    details.push({ label: "Model", value: model });
  }

  return details;
}

function summarizeStep(step: RunTrace["events"][number]): FlowStep {
  const details = describeToolArgs(step.toolName, step.raw);

  switch (step.type) {
    case "user_prompt":
      return {
        id: step.id,
        type: step.type,
        title: "User Prompt",
        summary: truncate(step.content || "Prompt"),
        content: step.content || "",
        timestamp: step.timestamp,
      };
    case "assistant_response":
      return {
        id: step.id,
        type: step.type,
        title: "Assistant Response",
        summary: step.content ? truncate(step.content) : "Assistant response",
        content: step.content || "",
        timestamp: step.timestamp,
      };
    case "tool_call": {
      const toolName = step.toolName || "tool";
      let summary = toolName;
      if (toolName === "read_file") summary = "Read file";
      else if (toolName === "search_files") summary = "Search files";
      else if (toolName === "write_file") summary = "Write file";
      else if (toolName === "patch") summary = "Patch file";
      else if (toolName === "terminal") summary = "Run terminal command";
      else if (toolName === "browser" || toolName.startsWith("browser_")) summary = "Use browser";
      else if (toolName === "memory") summary = "Update memory";
      else if (toolName === "skill_manage") summary = "Manage skill";

      return {
        id: step.id,
        type: step.type,
        title: step.title,
        summary,
        content: step.content,
        timestamp: step.timestamp,
        toolName,
        details,
      };
    }
    case "tool_result": {
      const toolName = step.toolName || "tool";
      let summary = toolName;
      if (toolName === "read_file") summary = "File contents read";
      else if (toolName === "search_files") summary = "Search results received";
      else if (toolName === "write_file") summary = "File written";
      else if (toolName === "patch") summary = "Patch applied";
      else if (toolName === "terminal") summary = "Command finished";
      else if (toolName === "browser" || toolName.startsWith("browser_")) summary = "Browser action finished";
      else if (toolName === "memory") summary = "Memory updated";
      else if (toolName === "skill_manage") summary = "Skill updated";

      return {
        id: step.id,
        type: step.type,
        title: step.title,
        summary,
        content: step.content,
        timestamp: step.timestamp,
        toolName,
        details,
      };
    }
    case "error":
    default:
      return {
        id: step.id,
        type: step.type,
        title: step.title,
        summary: truncate(step.content || "Unexpected error"),
        content: step.content,
        timestamp: step.timestamp,
      };
  }
}

function toFlowSummary(trace: RunTrace): FlowSummary {
  return {
    id: trace.id,
    profileId: trace.profile,
    sessionId: trace.sessionId,
    source: trace.source,
    status: trace.status,
    startedAt: trace.startedAt,
    finishedAt: trace.finishedAt,
    promptPreview: trace.promptPreview,
    model: trace.model || "unknown",
    stepCount: trace.events.length,
  };
}

function toFlowDetail(trace: RunTrace): FlowDetail {
  return {
    ...toFlowSummary(trace),
    steps: trace.events.map(summarizeStep),
  };
}

function buildLegacyTraces(traces: RunTrace[]) {
  return traces.map((trace) => ({
    id: trace.id,
    profile: trace.profile,
    sessionId: trace.sessionId,
    source: trace.source,
    status: trace.status,
    startedAt: trace.startedAt,
    finishedAt: trace.finishedAt,
    promptPreview: trace.promptPreview,
    finalAnswerPreview: trace.finalAnswerPreview,
    model: trace.model,
  }));
}

export function createApp(options: CreateAppOptions): express.Express {
  const app = express();
  const frontendDist = options.frontendDist ?? resolve(import.meta.dirname || ".", "..", "..", "frontend", "dist");

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/adapters", (_req, res) => {
    const availableProfiles = discoverProfiles(options.profilesDir).filter((profile) => profile.hasDb);
    const adapters: AdapterInfo[] = availableProfiles.length > 0
      ? [
          {
            id: "hermes",
            name: "Hermes",
            status: "available",
            profileCount: availableProfiles.length,
          },
        ]
      : [];

    res.json({ adapters });
  });

  app.get("/api/adapters/hermes/profiles", (_req, res) => {
    const profiles = discoverProfiles(options.profilesDir)
      .filter((profile) => profile.hasDb)
      .map<HermesProfileInfo>((profile) => ({
        id: profile.id,
        label: profile.label,
        status: "available",
      }));

    res.json({
      adapterId: "hermes",
      profiles,
      emptyState:
        profiles.length === 0
          ? {
              title: "No Hermes data yet",
              message: "Send a prompt to Hermes, then refresh Mission Control.",
            }
          : undefined,
    });
  });

  app.get("/api/adapters/hermes/profiles/:profileId/flows", (req, res) => {
    try {
      const profileId = req.params.profileId;
      const dbPath = getProfileDbPath(options.profilesDir, profileId);
      if (!dbPath) {
        jsonError(res, 404, "Profile not found", `No Hermes profile found with id '${profileId}'`);
        return;
      }

      const limit = clampNumber(req.query.limit, 20, 1, 100);
      const offset = clampNumber(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
      const db = options.openDb(dbPath);
      try {
        const traces = readTracesForProfile(db as never, { dbPath, profile: profileId });
        const page = traces.slice(offset, offset + limit).map(toFlowSummary);
        res.json({
          adapterId: "hermes",
          profileId,
          limit,
          offset,
          total: traces.length,
          hasMore: offset + limit < traces.length,
          flows: page,
        });
      } finally {
        db.close();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      jsonError(res, 500, "Failed to read flows", message);
    }
  });

  app.get("/api/adapters/hermes/profiles/:profileId/flows/:flowId", (req, res) => {
    try {
      const profileId = req.params.profileId;
      const flowId = req.params.flowId;
      const dbPath = getProfileDbPath(options.profilesDir, profileId);
      if (!dbPath) {
        jsonError(res, 404, "Profile not found", `No Hermes profile found with id '${profileId}'`);
        return;
      }

      const db = options.openDb(dbPath);
      try {
        const traces = readTracesForProfile(db as never, { dbPath, profile: profileId });
        const found = traces.find((trace) => trace.id === flowId);
        if (!found) {
          jsonError(res, 404, "Flow not found", `No Flow found with id '${flowId}' for profile '${profileId}'`);
          return;
        }

        res.json({
          adapterId: "hermes",
          profileId,
          flow: toFlowDetail(found),
        });
      } finally {
        db.close();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      jsonError(res, 500, "Failed to read flow", message);
    }
  });

  // Legacy routes kept for compatibility while the product migrates to Flow language.
  app.get("/api/profiles", (_req, res) => {
    try {
      const profiles = discoverProfiles(options.profilesDir).map((profile) => ({
        id: profile.id,
        label: profile.label,
        status: profile.hasDb ? "available" : "no-database",
      }));
      res.json(profiles);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      jsonError(res, 500, "Failed to discover profiles", message);
    }
  });

  app.get("/api/profiles/:id/traces", (req, res) => {
    try {
      const profileId = req.params.id;
      const dbPath = getProfileDbPath(options.profilesDir, profileId);
      if (!dbPath) {
        jsonError(res, 404, "Profile not found", `No Hermes profile found with id '${profileId}'`);
        return;
      }

      const db = options.openDb(dbPath);
      try {
        const traces = readTracesForProfile(db as never, { dbPath, profile: profileId });
        res.json(buildLegacyTraces(traces));
      } finally {
        db.close();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      jsonError(res, 500, "Failed to read traces", message);
    }
  });

  app.get("/api/traces/:traceId", (req, res) => {
    try {
      const traceId = req.params.traceId;
      const profiles = discoverProfiles(options.profilesDir);
      for (const profile of profiles) {
        if (!profile.hasDb) continue;
        const dbPath = getProfileDbPath(options.profilesDir, profile.id);
        if (!dbPath) continue;

        const db = options.openDb(dbPath);
        try {
          const traces = readTracesForProfile(db as never, { dbPath, profile: profile.id });
          const found = traces.find((trace) => trace.id === traceId);
          if (found) {
            res.json(found);
            return;
          }
        } finally {
          db.close();
        }
      }

      jsonError(res, 404, "Trace not found", `No trace found with id '${traceId}'`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      jsonError(res, 500, "Failed to read trace", message);
    }
  });

  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/^(?!\/api(?:\/|$)|\/health$).*/, (_req, res) => {
      const html = readFileSync(join(frontendDist, "index.html"), "utf-8");
      res.type("html").send(html);
    });
  } else {
    app.get(/^(?!\/api(?:\/|$)|\/health$).*/, (_req, res) => {
      res.type("html").send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>AIFlows</title></head>
<body>
  <h1>AIFlows</h1>
  <p>Backend is running. Start the frontend for Mission Control.</p>
  <ul>
    <li><a href="/health">/health</a></li>
    <li><a href="/api/adapters">/api/adapters</a></li>
  </ul>
</body>
</html>`);
    });
  }

  return app;
}
