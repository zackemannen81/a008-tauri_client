import assert from "node:assert/strict";
import { test } from "node:test";
import { createV2SessionClient } from "./v2-session-client.js";
import { V2_SUBPROTOCOL, type V2ClientFrame } from "./v2-types.js";
import type { GuiWebSocket, GuiWebSocketConstructor } from "../session/types.js";

const PROJECT = "A008_v1_project_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

class FakeSocket implements GuiWebSocket {
  readonly url: string;
  readonly protocol: string | string[] | undefined;
  readyState = 0;
  sent: string[] = [];
  readonly listeners = new Map<string, Set<(event: { readonly data?: unknown }) => void>>();

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocol = protocols;
    queueMicrotask(() => {
      this.readyState = 1;
      this.emit("open", {});
    });
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.emit("close", {});
  }

  addEventListener(
    type: "open" | "message" | "error" | "close",
    listener: (event: { readonly data?: unknown }) => void,
  ): void {
    const bucket = this.listeners.get(type) ?? new Set();
    bucket.add(listener);
    this.listeners.set(type, bucket);
  }

  removeEventListener(
    type: "open" | "message" | "error" | "close",
    listener: (event: { readonly data?: unknown }) => void,
  ): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, event: { readonly data?: unknown }): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }

  reply(frame: unknown): void {
    this.emit("message", { data: JSON.stringify(frame) });
  }

  lastFrame(): V2ClientFrame {
    const raw = this.sent.at(-1);
    assert.ok(raw);
    return JSON.parse(raw) as V2ClientFrame;
  }
}

function infoBody() {
  return {
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
  };
}

function state(messages: readonly { role: "user" | "assistant"; content: string }[] = [], active = false) {
  return {
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
    messages,
    active,
  };
}

test("configure can be extracted off the instance without losing private fields", () => {
  const client = createV2SessionClient({
    host: "http://127.0.0.1:8787",
    projectId: PROJECT,
  });
  const { configure } = client;
  configure({
    host: "http://127.0.0.1:8787",
    projectId: PROJECT,
    model: "gpt-5.6-luna",
  });
  assert.equal(client.model, "gpt-5.6-luna");
  assert.equal(client.projectId, PROJECT);
});

test("connects with a ticket, then session/new, then streams a prompt", async () => {
  let socket: FakeSocket | undefined;
  const FakeWebSocket = function (url: string, protocols?: string | string[]) {
    socket = new FakeSocket(url, protocols);
    return socket;
  } as unknown as GuiWebSocketConstructor;

  const fetchImpl: typeof fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/v2/info")) {
      return new Response(JSON.stringify(infoBody()), { status: 200 });
    }
    if (url.endsWith("/v2/auth/ticket")) {
      return new Response(
        JSON.stringify({
          serverInstanceId: "server_1",
          ticket: "t".repeat(32),
          expiresAt: Date.now() + 30_000,
          projectId: PROJECT,
        }),
        { status: 200 },
      );
    }
    throw new Error(`unexpected ${url}`);
  }) as typeof fetch;

  const client = createV2SessionClient({
    host: "http://127.0.0.1:8787",
    credential: "secret",
    projectId: PROJECT,
    fetchImpl,
    webSocket: FakeWebSocket,
    createRequestId: () => "req_1",
  });

  const connecting = client.connect();
  for (let attempt = 0; attempt < 30 && (!socket || socket.sent.length === 0); attempt += 1) {
    await Promise.resolve();
  }
  assert.ok(socket);
  assert.equal(socket.protocol, V2_SUBPROTOCOL);
  assert.equal(socket.lastFrame().type, "authenticate");

  socket.reply({
    type: "authenticated",
    serverInstanceId: "server_1",
    projectId: PROJECT,
  });
  await Promise.resolve();
  const created = socket.lastFrame();
  assert.equal(created.type, "command");
  if (created.type === "command") {
    assert.equal(created.action, "session/new");
    assert.equal("payload" in created, false);
  }

  socket.reply({
    type: "result",
    serverInstanceId: "server_1",
    requestId: "req_1",
    action: "session/new",
    projectId: PROJECT,
    sessionId: "session_1",
    state: state(),
  });
  await connecting;
  assert.equal(client.status, "ready");
  assert.equal(client.sessionId, "session_1");

  const prompting = client.prompt("Hej");
  await Promise.resolve();
  socket.reply({ type: "signal", signal: "thought", sessionId: "session_1", text: "thinking" });
  socket.reply({ type: "signal", signal: "answer", sessionId: "session_1", text: "Hallå" });
  socket.reply({
    type: "result",
    serverInstanceId: "server_1",
    requestId: "req_1",
    action: "session/prompt",
    projectId: PROJECT,
    sessionId: "session_1",
    state: state(
      [
        { role: "user", content: "Hej" },
        { role: "assistant", content: "Hallå" },
      ],
      false,
    ),
  });
  await prompting;
  assert.equal(client.details?.messages.at(-1)?.content, "Hallå");
  assert.equal(client.thought, "");
  assert.equal(client.busy, false);
  client.dispose();
});

test("surfaces structured V2 errors from ticket issuance", async () => {
  const fetchImpl: typeof fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/v2/info")) {
      return new Response(JSON.stringify(infoBody()), { status: 200 });
    }
    return new Response(
      JSON.stringify({
        type: "error",
        serverInstanceId: "server_1",
        code: "PROJECT_NOT_FOUND",
        message: "Project is not registered.",
        retryable: false,
      }),
      { status: 404 },
    );
  }) as typeof fetch;

  const client = createV2SessionClient({
    credential: "secret",
    projectId: PROJECT,
    fetchImpl,
    webSocket: class {
      constructor() {
        throw new Error("socket should not open");
      }
    } as unknown as GuiWebSocketConstructor,
  });
  await assert.rejects(client.connect(), /PROJECT_NOT_FOUND/);
  assert.equal(client.status, "error");
  client.dispose();
});
