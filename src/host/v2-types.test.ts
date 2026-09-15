import assert from "node:assert/strict";
import { test } from "node:test";
import {
  encodeClientFrame,
  parseV2Info,
  parseV2ServerFrame,
  parseV2Ticket,
  PROJECT_ID_PATTERN,
} from "./v2-types.js";

const PROJECT = "A008_v1_project_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

test("project IDs keep A008's existing identity shape", () => {
  assert.equal(PROJECT_ID_PATTERN.test(PROJECT), true);
  assert.equal(PROJECT_ID_PATTERN.test("not-a-project"), false);
});

test("parses public discovery without treating extra keys as fatal", () => {
  const info = parseV2Info({
    protocol: "a008.v2",
    serverInstanceId: "server_1",
    serverVersion: "0.0.0",
    authProfiles: ["device"],
    features: ["auth.tickets", "session.websocket"],
    limits: {
      ticketLifetimeMs: 30_000,
      preauthFrameBytes: 4096,
      authenticationDeadlineMs: 5000,
      inputFrameBytes: 1_048_576,
      outputFrameBytes: 8_388_608,
      promptBytes: 65_536,
    },
    extra: "ignored",
  });
  assert.equal(info?.protocol, "a008.v2");
  assert.equal(info?.features.includes("session.websocket"), true);
});

test("ticket responses require a usable secret", () => {
  assert.equal(
    parseV2Ticket({
      serverInstanceId: "server_1",
      ticket: "short",
      expiresAt: 1,
      projectId: PROJECT,
    }),
    undefined,
  );
  const ticket = parseV2Ticket({
    serverInstanceId: "server_1",
    ticket: "a".repeat(32),
    expiresAt: 1,
    projectId: PROJECT,
  });
  assert.equal(ticket?.ticket.length, 32);
});

test("session/new omits model so real ids with slashes and dots are not sent", () => {
  const encoded = encodeClientFrame({
    type: "command",
    requestId: "req_1",
    action: "session/new",
    projectId: PROJECT,
  });
  assert.equal(encoded.includes("model"), false);
  assert.equal(encoded.includes("payload"), false);
});

test("session commands stay strict: no commandId is encoded", () => {
  const encoded = encodeClientFrame({
    type: "command",
    requestId: "req_1",
    action: "session/prompt",
    projectId: PROJECT,
    sessionId: "session_1",
    payload: { text: "hello" },
  });
  assert.equal(encoded.includes("commandId"), false);
  assert.deepEqual(JSON.parse(encoded), {
    type: "command",
    requestId: "req_1",
    action: "session/prompt",
    projectId: PROJECT,
    sessionId: "session_1",
    payload: { text: "hello" },
  });
});

test("parses thought, permission and result frames", () => {
  const thought = parseV2ServerFrame({
    type: "signal",
    signal: "thought",
    sessionId: "session_1",
    text: "hmm",
  });
  assert.equal(thought && "signal" in thought && thought.signal === "thought", true);
  const permission = parseV2ServerFrame({
    type: "signal",
    signal: "tool/permission",
    sessionId: "session_1",
    permissionId: "perm_1",
    title: "write",
    text: "{}",
  });
  assert.equal(permission && "signal" in permission && permission.signal === "tool/permission", true);
  const result = parseV2ServerFrame({
    type: "result",
    serverInstanceId: "server_1",
    requestId: "req_1",
    action: "session/new",
    projectId: PROJECT,
    sessionId: "session_1",
    state: {
      projectId: PROJECT,
      sessionId: "session_1",
      model: "nvidia/nemotron-3.5-lightning-30b-a3b",
      parameters: {
        stream: true,
        temperature: null,
        topP: null,
        maxTokens: 1024,
        enableThinking: null,
        reasoningBudget: null,
        reasoningEffort: null,
        seed: null,
        stop: null,
      },
      messages: [],
      active: false,
    },
  });
  assert.equal(result?.type, "result");
  if (result?.type === "result") assert.equal(result.state?.sessionId, "session_1");
});
