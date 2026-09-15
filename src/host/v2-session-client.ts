import { hostFetch } from "./tauri-http.js";
import {
  fetchV2Info,
  fetchV2Ticket,
  resolveHostEndpoints,
} from "./v2-http.js";
import {
  DEFAULT_MODEL,
  encodeClientFrame,
  parseJson,
  parseV2ServerFrame,
  V2_SUBPROTOCOL,
  v2ErrorMessage,
  type SessionControl,
  type V2SessionCommand,
  type V2SessionState,
} from "./v2-types.js";
import type {
  ClientSession,
  GuiWebSocket,
  GuiWebSocketConstructor,
  SessionSnapshot,
  SessionStatus,
  ToolCall,
  ToolPermissionDecision,
} from "../session/types.js";

const SOCKET_OPEN = 1;

interface Pending {
  readonly requestId: string;
  readonly resolve: (state: V2SessionState) => void;
  readonly reject: (error: Error) => void;
}

export interface V2SessionClientOptions {
  readonly host?: string;
  readonly credential?: string;
  readonly projectId: string;
  readonly model?: string;
  readonly fetchImpl?: typeof fetch;
  readonly webSocket?: GuiWebSocketConstructor;
  readonly createRequestId?: () => string;
}

export interface V2SessionClient extends ClientSession {
  dispose(): void;
  subscribe(listener: () => void): () => void;
  getSnapshot(): SessionSnapshot;
  configure(options: Pick<V2SessionClientOptions, "host" | "credential" | "projectId" | "model">): void;
}

export function createV2SessionClient(options: V2SessionClientOptions): V2SessionClient {
  return new V2SessionClientImpl(options);
}

class V2SessionClientImpl implements V2SessionClient {
  #host: string;
  #credential: string;
  #projectId: string;
  #model: string;
  readonly #fetchImpl: typeof fetch;
  readonly #webSocket: GuiWebSocketConstructor | undefined;
  readonly #createRequestId: () => string;
  readonly #listeners = new Set<() => void>();
  #snapshot: SessionSnapshot;
  #socket: GuiWebSocket | undefined;
  #connectWork: Promise<void> | undefined;
  #pending: Pending | undefined;
  #allowAll = false;
  #generation = 0;

  constructor(options: V2SessionClientOptions) {
    this.#host = options.host ?? "";
    this.#credential = options.credential ?? "";
    this.#projectId = options.projectId;
    this.#model = options.model || DEFAULT_MODEL;
    this.#fetchImpl = options.fetchImpl ?? hostFetch;
    this.#webSocket = options.webSocket;
    this.#createRequestId = options.createRequestId ?? (() => globalThis.crypto.randomUUID());
    this.#snapshot = emptySnapshot(this.#model);
  }

  configure = (
    options: Pick<V2SessionClientOptions, "host" | "credential" | "projectId" | "model">,
  ): void => {
    this.#host = options.host ?? this.#host;
    if (options.credential !== undefined) this.#credential = options.credential;
    this.#projectId = options.projectId;
    if (options.model) {
      this.#model = options.model;
      this.#replace({ model: options.model, projectId: options.projectId });
    } else {
      this.#replace({ projectId: options.projectId });
    }
  };

  get status(): SessionStatus {
    return this.#snapshot.status;
  }
  get sessionId() {
    return this.#snapshot.sessionId;
  }
  get projectId() {
    return this.#snapshot.projectId;
  }
  get serverInstanceId() {
    return this.#snapshot.serverInstanceId;
  }
  get model() {
    return this.#snapshot.model;
  }
  get thought() {
    return this.#snapshot.thought;
  }
  get answer() {
    return this.#snapshot.answer;
  }
  get error() {
    return this.#snapshot.error;
  }
  get busy() {
    return this.#snapshot.busy;
  }
  get pendingText() {
    return this.#snapshot.pendingText;
  }
  get details() {
    return this.#snapshot.details;
  }
  get info() {
    return this.#snapshot.info;
  }
  get tools() {
    return this.#snapshot.tools;
  }
  get permission() {
    return this.#snapshot.permission;
  }

  getSnapshot = (): SessionSnapshot => this.#snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  dispose = (): void => {
    this.#generation += 1;
    this.#allowAll = false;
    this.#rejectPending(new Error("Client disposed."));
    this.#detachSocket();
    this.#connectWork = undefined;
    this.#replace({ status: "idle", sessionId: undefined, busy: false, tools: [], permission: undefined });
  };

  connect = async (): Promise<void> => {
    if (this.#connectWork) return this.#connectWork;
    const generation = this.#generation;
    this.#connectWork = this.#connect(generation).finally(() => {
      if (this.#generation === generation) this.#connectWork = undefined;
    });
    return this.#connectWork;
  };

  disconnect = async (): Promise<void> => {
    if (this.#snapshot.status === "ready" && this.#snapshot.sessionId) {
      try {
        await this.controlSession({ action: "close" });
      } catch {
        /* socket may already be gone */
      }
    }
    this.#generation += 1;
    this.#allowAll = false;
    this.#rejectPending(new Error("Disconnected."));
    this.#detachSocket();
    this.#connectWork = undefined;
    this.#replace({
      status: "idle",
      sessionId: undefined,
      busy: false,
      thought: "",
      answer: "",
      pendingText: undefined,
      permission: undefined,
      tools: [],
      error: undefined,
    });
  };

  prompt = async (text: string): Promise<void> => {
    const sessionId = this.#requireReady();
    if (this.#snapshot.busy) throw new Error("Wait for the current turn to finish.");
    this.#replace({
      busy: true,
      pendingText: text,
      thought: "",
      answer: "",
      tools: [],
      error: undefined,
    });
    try {
      await this.#request({
        type: "command",
        requestId: this.#createRequestId(),
        action: "session/prompt",
        projectId: this.#projectId,
        sessionId,
        payload: { text },
      });
    } catch (error) {
      this.#replace({ busy: false, error: toMessage(error, "Prompt failed.") });
      throw error;
    }
  };

  cancel = async (): Promise<void> => {
    const sessionId = this.#requireReady();
    await this.#request({
      type: "command",
      requestId: this.#createRequestId(),
      action: "session/cancel",
      projectId: this.#projectId,
      sessionId,
    });
  };

  controlSession = async (control: SessionControl): Promise<V2SessionState> => {
    const sessionId = this.#requireReady();
    this.#replace({ busy: true, error: undefined });
    try {
      const state = await this.#request({
        type: "command",
        requestId: this.#createRequestId(),
        action: "session/control",
        projectId: this.#projectId,
        sessionId,
        payload: { control },
      });
      if (control.action === "close") {
        this.#allowAll = false;
        this.#detachSocket();
        this.#replace({
          status: "idle",
          sessionId: undefined,
          busy: false,
          thought: "",
          answer: "",
          pendingText: undefined,
          permission: undefined,
          tools: [],
        });
      }
      return state;
    } catch (error) {
      this.#replace({ busy: false, error: toMessage(error, "Session control failed.") });
      throw error;
    }
  };

  resolveToolPermission = (decision: ToolPermissionDecision): void => {
    const permission = this.#snapshot.permission;
    const sessionId = this.#snapshot.sessionId;
    if (!permission || !sessionId || this.#socket?.readyState !== SOCKET_OPEN) return;
    if (decision === "allow_all") this.#allowAll = true;
    this.#socket.send(
      encodeClientFrame({
        type: "command",
        requestId: this.#createRequestId(),
        action: "tool/permission",
        projectId: this.#projectId,
        sessionId,
        payload: { permissionId: permission.id, allow: decision !== "reject" },
      }),
    );
    this.#replace({ permission: undefined });
  };

  async #connect(generation: number): Promise<void> {
    this.#replace({ status: "connecting", error: undefined, thought: "", answer: "" });
    try {
      const endpoints = resolveHostEndpoints(this.#host);
      const info = await fetchV2Info(endpoints.httpBase, this.#fetchImpl);
      if (this.#generation !== generation) return;
      this.#replace({ info, serverInstanceId: info.serverInstanceId });
      const ticket = await fetchV2Ticket(
        endpoints.httpBase,
        this.#credential,
        this.#projectId,
        this.#fetchImpl,
      );
      if (this.#generation !== generation) return;
      await this.#openSocket(endpoints.wsUrl, ticket.ticket, generation);
    } catch (error) {
      if (this.#generation !== generation) return;
      this.#detachSocket();
      this.#replace({
        status: "error",
        busy: false,
        error: toMessage(error, "Could not connect to A008."),
      });
      throw error;
    }
  }

  #openSocket(url: string, ticket: string, generation: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const Socket = this.#webSocket ?? (globalThis.WebSocket as unknown as GuiWebSocketConstructor);
      const socket = new Socket(url, V2_SUBPROTOCOL);
      this.#socket = socket;
      const onOpen = (): void => {
        socket.send(encodeClientFrame({ type: "authenticate", ticket }));
      };
      const onMessage = (event: { readonly data?: unknown }): void => {
        if (this.#generation !== generation) return;
        const raw = typeof event.data === "string" ? event.data : String(event.data ?? "");
        this.#onFrame(raw, resolve, reject);
      };
      const onError = (): void => {
        if (this.#generation !== generation) return;
        reject(new Error("WebSocket failed."));
      };
      const onClose = (): void => {
        if (this.#generation !== generation) return;
        if (this.#snapshot.status === "connecting") {
          reject(new Error("WebSocket closed before authentication finished."));
          return;
        }
        if (this.#snapshot.status === "ready") {
          this.#rejectPending(new Error("Connection closed."));
          this.#replace({
            status: "error",
            busy: false,
            error: "Connection closed.",
            permission: undefined,
          });
        }
      };
      socket.addEventListener("open", onOpen);
      socket.addEventListener("message", onMessage);
      socket.addEventListener("error", onError);
      socket.addEventListener("close", onClose);
    });
  }

  #onFrame(
    raw: string,
    resolveConnect: () => void,
    rejectConnect: (error: Error) => void,
  ): void {
    const frame = parseV2ServerFrame(parseJson(raw));
    if (!frame) return;
    if (frame.type === "error") {
      const error = new Error(v2ErrorMessage(frame));
      const pending = this.#pending;
      if (pending && pending.requestId === frame.requestId) {
        pending.reject(error);
        this.#pending = undefined;
        this.#replace({ busy: false, error: error.message });
        return;
      }
      if (this.#snapshot.status === "connecting") {
        rejectConnect(error);
        return;
      }
      this.#replace({ error: error.message });
      return;
    }
    if (frame.type === "authenticated") {
      this.#replace({
        serverInstanceId: frame.serverInstanceId,
        projectId: frame.projectId,
      });
      void this.#createSession(frame.projectId).then(resolveConnect, rejectConnect);
      return;
    }
    if (frame.type === "result") {
      const state = frame.state;
      const pendingResult = this.#pending;
      if (pendingResult && pendingResult.requestId === frame.requestId) {
        if (!state) {
          pendingResult.reject(new Error("V2 result did not include session state."));
          this.#pending = undefined;
          return;
        }
        pendingResult.resolve(state);
        this.#pending = undefined;
        this.#applyState(state);
      } else if (state) {
        this.#applyState(state);
      }
      return;
    }
    if (frame.signal === "thought") {
      this.#replace({ thought: `${this.#snapshot.thought}${frame.text}` });
      return;
    }
    if (frame.signal === "answer") {
      this.#replace({ answer: `${this.#snapshot.answer}${frame.text}` });
      return;
    }
    if (frame.signal === "tool") {
      this.#replace({ tools: upsertTool(this.#snapshot.tools, frame) });
      return;
    }
    if (frame.signal === "tool/permission") {
      if (this.#allowAll && this.#socket?.readyState === SOCKET_OPEN && this.#snapshot.sessionId) {
        this.#socket.send(
          encodeClientFrame({
            type: "command",
            requestId: this.#createRequestId(),
            action: "tool/permission",
            projectId: this.#projectId,
            sessionId: this.#snapshot.sessionId,
            payload: { permissionId: frame.permissionId, allow: true },
          }),
        );
        return;
      }
      this.#replace({
        permission: { id: frame.permissionId, title: frame.title, text: frame.text },
      });
    }
  }

  async #createSession(projectId: string): Promise<void> {
    // session/new payload.model is a V2 id (`[A-Za-z0-9_-]+`). Real model
    // ids contain `/` and `.`, so they must be applied with session/control.
    const created = await this.#request({
      type: "command",
      requestId: this.#createRequestId(),
      action: "session/new",
      projectId,
    });
    let state = created;
    if (this.#model !== "" && this.#model !== created.model) {
      try {
        state = await this.#request({
          type: "command",
          requestId: this.#createRequestId(),
          action: "session/control",
          projectId,
          sessionId: created.sessionId,
          payload: { control: { action: "model", model: this.#model } },
        });
      } catch {
        state = created;
      }
    }
    this.#replace({ status: "ready", error: undefined });
    this.#applyState(state);
  }

  #request(command: V2SessionCommand): Promise<V2SessionState> {
    if (this.#socket?.readyState !== SOCKET_OPEN) {
      return Promise.reject(new Error("Not connected."));
    }
    if (this.#pending) return Promise.reject(new Error("Wait for the current operation to finish."));
    const done = new Promise<V2SessionState>((resolve, reject) => {
      this.#pending = { requestId: command.requestId, resolve, reject };
    });
    try {
      this.#socket.send(encodeClientFrame(command));
    } catch (error) {
      this.#pending = undefined;
      return Promise.reject(error);
    }
    return done;
  }

  #applyState(state: V2SessionState): void {
    this.#model = state.model;
    this.#replace({
      status: state.closed ? "idle" : this.#snapshot.status === "connecting" ? "ready" : this.#snapshot.status,
      sessionId: state.sessionId,
      projectId: state.projectId,
      model: state.model,
      details: state,
      busy: state.active,
      thought: state.active ? this.#snapshot.thought : "",
      answer: state.active ? this.#snapshot.answer : "",
      pendingText: state.active ? this.#snapshot.pendingText : undefined,
    });
  }

  #requireReady(): string {
    const sessionId = this.#snapshot.sessionId;
    if (this.#snapshot.status !== "ready" || !sessionId || this.#socket?.readyState !== SOCKET_OPEN) {
      throw new Error("Connect to a session first.");
    }
    return sessionId;
  }

  #rejectPending(error: Error): void {
    this.#pending?.reject(error);
    this.#pending = undefined;
  }

  #detachSocket(): void {
    const socket = this.#socket;
    this.#socket = undefined;
    try {
      socket?.close();
    } catch {
      /* already closed */
    }
  }

  #replace(patch: Partial<SessionSnapshot>): void {
    this.#snapshot = { ...this.#snapshot, ...patch };
    for (const listener of this.#listeners) listener();
  }
}

function emptySnapshot(model: string): SessionSnapshot {
  return {
    status: "idle",
    sessionId: undefined,
    projectId: undefined,
    serverInstanceId: undefined,
    model,
    thought: "",
    answer: "",
    error: undefined,
    busy: false,
    pendingText: undefined,
    details: undefined,
    info: undefined,
    tools: [],
    permission: undefined,
  };
}

function upsertTool(
  tools: readonly ToolCall[],
  frame: { readonly id: string; readonly title: string; readonly status: string; readonly text: string },
): readonly ToolCall[] {
  const next: ToolCall = {
    id: frame.id,
    title: frame.title,
    status: frame.status,
    text: frame.text,
  };
  const index = tools.findIndex((tool) => tool.id === frame.id);
  if (index < 0) return [...tools, next];
  return tools.map((tool, current) => (current === index ? next : tool));
}

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
