import assert from "node:assert/strict";
import { test } from "node:test";
import { buildChatTranscript } from "./chat-transcript.js";
import type { ClientSession } from "../session/types.js";

function session(patch: Partial<ClientSession>): ClientSession {
  return {
    status: "ready",
    sessionId: "session_1",
    projectId: "project",
    serverInstanceId: "server_1",
    model: "model",
    thought: "",
    answer: "",
    error: undefined,
    busy: false,
    pendingText: undefined,
    details: undefined,
    info: undefined,
    tools: [],
    permission: undefined,
    connect: async () => undefined,
    disconnect: async () => undefined,
    prompt: async () => undefined,
    cancel: async () => undefined,
    controlSession: async () => {
      throw new Error("unused");
    },
    resolveToolPermission: () => undefined,
    ...patch,
  };
}

test("empty session has no turns", () => {
  assert.equal(buildChatTranscript(session({})).empty, true);
});

test("committed messages stay distinct from live thought", () => {
  const transcript = buildChatTranscript(
    session({
      details: {
        projectId: "p",
        sessionId: "s",
        model: "m",
        parameters: {
          stream: true,
          temperature: null,
          topP: null,
          maxTokens: 1,
          enableThinking: null,
          reasoningBudget: null,
          reasoningEffort: null,
          seed: null,
          stop: null,
        },
        messages: [
          { role: "user", content: "Hej" },
          { role: "assistant", content: "Hallå" },
        ],
        active: false,
      },
    }),
  );
  assert.equal(transcript.turns.length, 2);
  assert.equal(transcript.turns[0]?.kind, "user");
  assert.equal(transcript.turns[1]?.kind, "assistant");
  if (transcript.turns[1]?.kind === "assistant") {
    assert.equal(transcript.turns[1].answer, "Hallå");
    assert.equal(transcript.turns[1].thought, "");
  }
});

test("live thought is not merged into committed answers", () => {
  const transcript = buildChatTranscript(
    session({
      busy: true,
      pendingText: "Next",
      thought: "secret",
      answer: "partial",
    }),
  );
  const assistant = transcript.turns.find((turn) => turn.kind === "assistant");
  assert.equal(assistant?.kind, "assistant");
  if (assistant?.kind === "assistant") {
    assert.equal(assistant.thought, "secret");
    assert.equal(assistant.answer, "partial");
    assert.equal(assistant.live, true);
  }
});

test("completed tool activity stays on the completed assistant turn", () => {
  const transcript = buildChatTranscript(
    session({
      details: {
        projectId: "p",
        sessionId: "s",
        model: "m",
        parameters: {
          stream: true,
          temperature: null,
          topP: null,
          maxTokens: 1,
          enableThinking: null,
          reasoningBudget: null,
          reasoningEffort: null,
          seed: null,
          stop: null,
        },
        messages: [
          { role: "user", content: "status?" },
          { role: "assistant", content: "clean" },
        ],
        active: false,
      },
      tools: [{ id: "tool-1", title: "git", status: "completed", text: "clean" }],
    }),
  );
  assert.equal(transcript.turns.length, 2);
  const last = transcript.turns.at(-1);
  assert.equal(last?.kind, "assistant");
  if (last?.kind === "assistant") {
    assert.equal(last.live, false);
    assert.equal(last.tools?.length, 1);
    assert.equal(last.tools?.[0]?.title, "git");
  }
});
