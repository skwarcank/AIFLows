import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../src/App";

vi.mock("../src/components/GraphView", () => ({
  default: ({ steps }: { steps: Array<{ id: string; summary: string }> }) => (
    <div data-testid="graph-view">Graph with {steps.length} steps</div>
  ),
}));

vi.mock("../src/components/DetailPanel", () => ({
  default: ({ step }: { step: { title: string; summary: string } | null }) => (
    <div data-testid="detail-panel">{step ? step.summary : "No step"}</div>
  ),
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const adapterPayload = {
  adapters: [{ id: "hermes", name: "Hermes", status: "available", profileCount: 1 }],
};

const profilesPayload = {
  adapterId: "hermes",
  profiles: [{ id: "default", label: "default", status: "available" }],
};

const flowsPayload = {
  adapterId: "hermes",
  profileId: "default",
  limit: 20,
  offset: 0,
  total: 1,
  hasMore: false,
  flows: [
    {
      id: "flow-1",
      profileId: "default",
      sessionId: "sess-1",
      source: "telegram",
      status: "completed",
      startedAt: "2024-01-01T00:00:00.000Z",
      finishedAt: "2024-01-01T00:01:00.000Z",
      promptPreview: "Build the flow replay",
      model: "gpt-4o-mini",
      stepCount: 4,
    },
  ],
};

const flowPayload = {
  adapterId: "hermes",
  profileId: "default",
  flow: {
    ...flowsPayload.flows[0],
    steps: [
      {
        id: "step-1",
        type: "user_prompt",
        title: "User Prompt",
        summary: "Build the flow replay",
        content: "Build the flow replay",
      },
      {
        id: "step-2",
        type: "tool_call",
        title: "Read file",
        summary: "Read file",
        toolName: "read_file",
        details: [{ label: "Path", value: "/root/projects/AIFlows/README.md" }],
      },
      {
        id: "step-3",
        type: "tool_result",
        title: "Tool Result",
        summary: "File contents read",
        toolName: "read_file",
      },
      {
        id: "step-4",
        type: "assistant_response",
        title: "Assistant Response",
        summary: "Done",
        content: "Done",
      },
    ],
  },
};

function installFetchMock() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/health")) return jsonResponse({ ok: true });
      if (url.endsWith("/api/adapters")) return jsonResponse(adapterPayload);
      if (url.endsWith("/api/adapters/hermes/profiles")) return jsonResponse(profilesPayload);
      if (url.includes("/api/adapters/hermes/profiles/default/flows?limit=20&offset=0")) {
        return jsonResponse(flowsPayload);
      }
      if (url.endsWith("/api/adapters/hermes/profiles/default/flows/flow-1")) {
        return jsonResponse(flowPayload);
      }
      if (url.endsWith("/api/adapters/hermes/profiles/default/flows?limit=20&offset=1")) {
        return jsonResponse({ ...flowsPayload, flows: [], hasMore: false, offset: 1, total: 1 });
      }
      return jsonResponse({ error: "not found", message: `Unexpected fetch: ${url}` }, 404);
    }) as typeof fetch
  );
}

function renderApp() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<App />);
  });
  return { container, root };
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  window.history.pushState({}, "", "/");
});

describe("AIFlows routed navigation", () => {
  beforeEach(() => {
    installFetchMock();
    window.history.pushState({}, "", "/");
  });

  it("renders Mission Control, navigates to Hermes profiles, and opens a Flow replay", async () => {
    const { container } = renderApp();
    await flush();

    expect(container.textContent).toContain("Mission Control");
    expect(container.textContent).toContain("Hermes");

    const hermesButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Hermes")
    ) as HTMLButtonElement | undefined;
    expect(hermesButton).toBeTruthy();
    hermesButton!.click();
    await flush();

    expect(container.textContent).toContain("Choose a Hermes profile");
    expect(container.textContent).toContain("default");

    const profileButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.trim() === "default"
    ) as HTMLButtonElement | undefined;
    expect(profileButton).toBeTruthy();
    profileButton!.click();
    await flush();

    expect(container.textContent).toContain("Recent Flows");
    expect(container.textContent).toContain("Build the flow replay");

    const flowButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Build the flow replay")
    ) as HTMLButtonElement | undefined;
    expect(flowButton).toBeTruthy();
    flowButton!.click();
    await flush();

    expect(container.textContent).toContain("Flow Replay");
    expect(container.textContent).toContain("Build the flow replay");
    expect(container.textContent).toContain("Timeline");
    expect(container.textContent).toContain("Selected Step");
  });

  it("deep-links directly to a Flow replay", async () => {
    window.history.pushState({}, "", "/adapters/hermes/profiles/default/flows/flow-1");
    const { container } = renderApp();
    await flush();

    expect(container.textContent).toContain("Flow Replay");
    expect(container.textContent).toContain("Build the flow replay");
    expect(container.textContent).toContain("Timeline");
    expect(container.textContent).toContain("Selected Step");
    expect(container.textContent).toContain("Read file");
  });
});
