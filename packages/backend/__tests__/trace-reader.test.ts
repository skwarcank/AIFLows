import { describe, it, expect } from "vitest";
import { buildEvents, traceToGraphData } from "../src/trace-reader.js";
import type { RunTrace } from "../src/types.js";

interface MockMessage {
  id: number;
  role: string;
  content: string | null;
  timestamp: number | null;
  finish_reason: string | null;
  tool_calls: string | null;
  tool_call_id: string | null;
  tool_name: string | null;
  session_id: string;
}

function msg(overrides: Partial<MockMessage> & { id: number; role: string }): MockMessage {
  return {
    session_id: "test-session",
    content: null,
    timestamp: 1000000,
    finish_reason: null,
    tool_calls: null,
    tool_call_id: null,
    tool_name: null,
    ...overrides,
  };
}

describe("buildEvents", () => {
  it("returns user_prompt and assistant_response for simple user->assistant sequence", () => {
    const messages = [
      msg({ id: 1, role: "user", content: "Hello" }),
      msg({ id: 2, role: "assistant", content: "Hi there", finish_reason: "stop" }),
    ];
    const events = buildEvents(messages);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("user_prompt");
    expect(events[0].content).toBe("Hello");
    expect(events[1].type).toBe("assistant_response");
    expect(events[1].content).toBe("Hi there");
  });

  it("includes tool_call events when assistant has tool_calls", () => {
    const messages = [
      msg({ id: 1, role: "user", content: "Search for files" }),
      msg({
        id: 2,
        role: "assistant",
        finish_reason: "tool_calls",
        tool_calls: JSON.stringify([
          { id: "call1", function: { name: "search_files", arguments: '{"query":"test"}' } },
        ]),
      }),
      msg({
        id: 3,
        role: "tool",
        tool_call_id: "call1",
        tool_name: "search_files",
        content: JSON.stringify({ result: "file1.txt" }),
      }),
      msg({ id: 4, role: "assistant", content: "Found files", finish_reason: "stop" }),
    ];
    const events = buildEvents(messages);
    expect(events).toHaveLength(4);
    expect(events[0].type).toBe("user_prompt");
    expect(events[1].type).toBe("tool_call");
    expect(events[1].toolName).toBe("search_files");
    expect(events[1].title).toBe("Tool Call: search_files");
    expect(events[2].type).toBe("tool_result");
    expect(events[2].toolName).toBe("search_files");
    expect(events[3].type).toBe("assistant_response");
  });

  it("includes error event when tool_calls JSON is malformed", () => {
    const messages = [
      msg({ id: 1, role: "user", content: "Do something" }),
      msg({
        id: 2,
        role: "assistant",
        finish_reason: "tool_calls",
        tool_calls: "{invalid json}",
      }),
      msg({ id: 3, role: "assistant", content: "Sorry", finish_reason: "stop" }),
    ];
    const events = buildEvents(messages);
    expect(events).toHaveLength(3);
    expect(events[1].type).toBe("error");
    expect(events[1].title).toBe("Malformed Tool Calls");
  });

  it("handles assistant with finish_reason=stop but no content", () => {
    const messages = [
      msg({ id: 1, role: "user", content: "Hello" }),
      msg({ id: 2, role: "assistant", content: null, finish_reason: "stop" }),
    ];
    const events = buildEvents(messages);
    expect(events).toHaveLength(2);
    expect(events[1].type).toBe("assistant_response");
    expect(events[1].content).toBe("");
  });

  it("handles empty tool_calls array - no events generated for empty list", () => {
    const messages = [
      msg({ id: 1, role: "user", content: "Hi" }),
      msg({
        id: 2,
        role: "assistant",
        finish_reason: "tool_calls",
        tool_calls: "[]",
      }),
      msg({ id: 3, role: "assistant", content: "Done", finish_reason: "stop" }),
    ];
    const events = buildEvents(messages);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("user_prompt");
    expect(events[1].type).toBe("assistant_response");
  });
});

describe("traceToGraphData", () => {
  it("creates nodes and edges from trace events", () => {
    const trace: RunTrace = {
      id: "trace-1",
      profile: "default",
      sessionId: "sess-1",
      source: "telegram",
      status: "completed",
      startedAt: "2024-01-01T00:00:00Z",
      finishedAt: "2024-01-01T00:01:00Z",
      promptPreview: "Hello",
      finalAnswerPreview: "Hi",
      events: [
        {
          id: "evt-1",
          type: "user_prompt",
          title: "User Prompt",
          content: "Hello",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          id: "evt-2",
          type: "assistant_response",
          title: "Assistant Response",
          content: "Hi",
          timestamp: "2024-01-01T00:01:00Z",
        },
      ],
    };
    const graph = traceToGraphData(trace);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].source).toBe(graph.nodes[0].id);
    expect(graph.edges[0].target).toBe(graph.nodes[1].id);
  });

  it("creates sequential edges for multiple events", () => {
    const trace: RunTrace = {
      id: "trace-2",
      profile: "default",
      sessionId: "sess-1",
      source: "telegram",
      status: "completed",
      startedAt: "2024-01-01T00:00:00Z",
      finishedAt: "2024-01-01T00:01:00Z",
      promptPreview: "Search",
      finalAnswerPreview: "Found",
      events: [
        { id: "e1", type: "user_prompt", title: "User Prompt" },
        { id: "e2", type: "tool_call", title: "Tool Call: search", toolName: "search" },
        { id: "e3", type: "tool_result", title: "Tool Result" },
        { id: "e4", type: "assistant_response", title: "Assistant Response" },
      ],
    };
    const graph = traceToGraphData(trace);
    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(3);
    expect(graph.nodes[0].order).toBe(1);
    expect(graph.nodes[3].order).toBe(4);
  });
});
