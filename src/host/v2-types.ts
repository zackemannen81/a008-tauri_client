/** Observed A008 V2 wire types (A008-0110 / A008-0112). Extra inbound keys are ignored. */

export const V2_SUBPROTOCOL = "a008.v2";
export const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
export const PROJECT_ID_PATTERN =
  /^A008_v1_project_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
export const V2_ID_PATTERN = /^[A-Za-z0-9_-]{1,160}$/u;

export const V2_SESSION_ACTIONS = [
  "session/new",
  "session/inspect",
  "session/prompt",
  "session/cancel",
  "session/control",
  "tool/permission",
] as const;

export type V2SessionAction = (typeof V2_SESSION_ACTIONS)[number];

export interface V2Limits {
  readonly ticketLifetimeMs: number;
  readonly preauthFrameBytes: number;
  readonly authenticationDeadlineMs: number;
  readonly inputFrameBytes: number;
  readonly outputFrameBytes: number;
  readonly promptBytes: number;
}

export interface V2Info {
  readonly protocol: "a008.v2";
  readonly serverInstanceId: string;
  readonly serverVersion: string;
  readonly authProfiles: readonly string[];
  readonly features: readonly string[];
  readonly limits: V2Limits;
}

export interface V2Error {
  readonly type: "error";
  readonly serverInstanceId: string;
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
  readonly requestId?: string;
  readonly projectId?: string;
  readonly sessionId?: string;
}

export interface V2Ticket {
  readonly serverInstanceId: string;
  readonly ticket: string;
  readonly expiresAt: number;
  readonly projectId: string;
  readonly sessionId?: string;
}

export interface SessionParameters {
  readonly stream: boolean;
  readonly temperature: number | null;
  readonly topP: number | null;
  readonly maxTokens: number;
  readonly enableThinking: boolean | null;
  readonly reasoningBudget: number | null;
  readonly reasoningEffort: string | null;
  readonly seed: number | null;
  readonly stop: readonly string[] | null;
}

export interface SessionMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface SessionTool {
  readonly name: string;
  readonly description: string;
}

export interface V2SessionState {
  readonly projectId: string;
  readonly sessionId: string;
  readonly model: string;
  readonly parameters: SessionParameters;
  readonly messages: readonly SessionMessage[];
  readonly active: boolean;
  readonly tools?: readonly SessionTool[];
  readonly undone?: boolean;
  readonly closed?: boolean;
}

export type SessionControl =
  | { readonly action: "inspect" | "reset" | "undo" | "close" }
  | { readonly action: "model"; readonly model: string }
  | { readonly action: "configure"; readonly parameters: SessionParameters }
  | {
      readonly action: "configureRuntime";
      readonly settings: { readonly instructions: string; readonly budgets: Record<string, number> };
      readonly revision: string;
    };

export type V2SessionCommand =
  | {
      readonly type: "command";
      readonly requestId: string;
      readonly action: "session/new";
      readonly projectId: string;
      readonly payload?: { readonly model?: string };
    }
  | {
      readonly type: "command";
      readonly requestId: string;
      readonly action: "session/inspect" | "session/cancel";
      readonly projectId: string;
      readonly sessionId: string;
    }
  | {
      readonly type: "command";
      readonly requestId: string;
      readonly action: "session/prompt";
      readonly projectId: string;
      readonly sessionId: string;
      readonly payload: { readonly text: string };
    }
  | {
      readonly type: "command";
      readonly requestId: string;
      readonly action: "session/control";
      readonly projectId: string;
      readonly sessionId: string;
      readonly payload: { readonly control: SessionControl };
    }
  | {
      readonly type: "command";
      readonly requestId: string;
      readonly action: "tool/permission";
      readonly projectId: string;
      readonly sessionId: string;
      readonly payload: { readonly permissionId: string; readonly allow: boolean };
    };

export type V2ClientFrame =
  | { readonly type: "authenticate"; readonly ticket: string }
  | V2SessionCommand;

export type V2Signal =
  | {
      readonly type: "signal";
      readonly signal: "thought" | "answer";
      readonly sessionId: string;
      readonly text: string;
    }
  | {
      readonly type: "signal";
      readonly signal: "tool";
      readonly sessionId: string;
      readonly id: string;
      readonly title: string;
      readonly status: string;
      readonly text: string;
    }
  | {
      readonly type: "signal";
      readonly signal: "tool/permission";
      readonly sessionId: string;
      readonly permissionId: string;
      readonly title: string;
      readonly text: string;
    };

export type V2ServerFrame =
  | {
      readonly type: "authenticated";
      readonly serverInstanceId: string;
      readonly projectId: string;
      readonly sessionId?: string;
    }
  | {
      readonly type: "result";
      readonly serverInstanceId: string;
      readonly requestId: string;
      readonly action: string;
      readonly projectId: string;
      readonly sessionId?: string;
      readonly state?: V2SessionState;
    }
  | V2Signal
  | V2Error;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export function parseV2Error(value: unknown): V2Error | undefined {
  if (!isRecord(value) || value.type !== "error") return undefined;
  const serverInstanceId = asString(value.serverInstanceId);
  const code = asString(value.code);
  const message = asString(value.message);
  if (!serverInstanceId || !code || !message || typeof value.retryable !== "boolean") {
    return undefined;
  }
  return {
    type: "error",
    serverInstanceId,
    code,
    message,
    retryable: value.retryable,
    ...(asString(value.requestId) ? { requestId: asString(value.requestId) } : {}),
    ...(asString(value.projectId) ? { projectId: asString(value.projectId) } : {}),
    ...(asString(value.sessionId) ? { sessionId: asString(value.sessionId) } : {}),
  };
}

export function parseV2Info(value: unknown): V2Info | undefined {
  if (!isRecord(value) || value.protocol !== "a008.v2") return undefined;
  const serverInstanceId = asString(value.serverInstanceId);
  const serverVersion = asString(value.serverVersion);
  const limits = isRecord(value.limits) ? value.limits : undefined;
  if (!serverInstanceId || !serverVersion || !limits) return undefined;
  const ticketLifetimeMs = asNumber(limits.ticketLifetimeMs);
  const preauthFrameBytes = asNumber(limits.preauthFrameBytes);
  const authenticationDeadlineMs = asNumber(limits.authenticationDeadlineMs);
  const inputFrameBytes = asNumber(limits.inputFrameBytes);
  const outputFrameBytes = asNumber(limits.outputFrameBytes);
  const promptBytes = asNumber(limits.promptBytes);
  if (
    ticketLifetimeMs === undefined ||
    preauthFrameBytes === undefined ||
    authenticationDeadlineMs === undefined ||
    inputFrameBytes === undefined ||
    outputFrameBytes === undefined ||
    promptBytes === undefined
  ) {
    return undefined;
  }
  return {
    protocol: "a008.v2",
    serverInstanceId,
    serverVersion,
    authProfiles: Array.isArray(value.authProfiles)
      ? value.authProfiles.filter((item): item is string => typeof item === "string")
      : [],
    features: Array.isArray(value.features)
      ? value.features.filter((item): item is string => typeof item === "string")
      : [],
    limits: {
      ticketLifetimeMs,
      preauthFrameBytes,
      authenticationDeadlineMs,
      inputFrameBytes,
      outputFrameBytes,
      promptBytes,
    },
  };
}

export function parseV2Ticket(value: unknown): V2Ticket | undefined {
  if (!isRecord(value)) return undefined;
  const serverInstanceId = asString(value.serverInstanceId);
  const ticket = asString(value.ticket);
  const projectId = asString(value.projectId);
  if (
    !serverInstanceId ||
    !ticket ||
    ticket.length < 32 ||
    !projectId ||
    typeof value.expiresAt !== "number"
  ) {
    return undefined;
  }
  return {
    serverInstanceId,
    ticket,
    expiresAt: value.expiresAt,
    projectId,
    ...(asString(value.sessionId) ? { sessionId: asString(value.sessionId) } : {}),
  };
}

function parseParameters(value: unknown): SessionParameters | undefined {
  if (!isRecord(value) || typeof value.stream !== "boolean" || typeof value.maxTokens !== "number") {
    return undefined;
  }
  const nullableNumber = (item: unknown): number | null =>
    item === null || typeof item === "number" ? item : null;
  const nullableString = (item: unknown): string | null =>
    item === null || typeof item === "string" ? item : null;
  const nullableBool = (item: unknown): boolean | null =>
    item === null || typeof item === "boolean" ? item : null;
  return {
    stream: value.stream,
    temperature: nullableNumber(value.temperature),
    topP: nullableNumber(value.topP),
    maxTokens: value.maxTokens,
    enableThinking: nullableBool(value.enableThinking),
    reasoningBudget: nullableNumber(value.reasoningBudget),
    reasoningEffort: nullableString(value.reasoningEffort),
    seed: nullableNumber(value.seed),
    stop: Array.isArray(value.stop)
      ? value.stop.filter((item): item is string => typeof item === "string")
      : value.stop === null
        ? null
        : null,
  };
}

export function parseV2SessionState(value: unknown): V2SessionState | undefined {
  if (!isRecord(value)) return undefined;
  const projectId = asString(value.projectId);
  const sessionId = asString(value.sessionId);
  const model = asString(value.model);
  const parameters = parseParameters(value.parameters);
  if (!projectId || !sessionId || !model || !parameters || typeof value.active !== "boolean") {
    return undefined;
  }
  const messages: SessionMessage[] = [];
  if (Array.isArray(value.messages)) {
    for (const entry of value.messages) {
      if (!isRecord(entry)) continue;
      const role = entry.role === "user" || entry.role === "assistant" ? entry.role : undefined;
      const content = asString(entry.content);
      if (role === undefined || content === undefined) continue;
      messages.push({ role, content });
    }
  }
  const tools = Array.isArray(value.tools)
    ? value.tools.flatMap((entry) => {
        if (!isRecord(entry)) return [];
        const name = asString(entry.name);
        const description = asString(entry.description);
        if (!name || description === undefined) return [];
        return [{ name, description }];
      })
    : undefined;
  return {
    projectId,
    sessionId,
    model,
    parameters,
    messages,
    active: value.active,
    ...(tools ? { tools } : {}),
    ...(typeof value.undone === "boolean" ? { undone: value.undone } : {}),
    ...(typeof value.closed === "boolean" ? { closed: value.closed } : {}),
  };
}

export function parseV2ServerFrame(value: unknown): V2ServerFrame | undefined {
  const error = parseV2Error(value);
  if (error) return error;
  if (!isRecord(value)) return undefined;
  if (value.type === "authenticated") {
    const serverInstanceId = asString(value.serverInstanceId);
    const projectId = asString(value.projectId);
    if (!serverInstanceId || !projectId) return undefined;
    return {
      type: "authenticated",
      serverInstanceId,
      projectId,
      ...(asString(value.sessionId) ? { sessionId: asString(value.sessionId) } : {}),
    };
  }
  if (value.type === "result") {
    const serverInstanceId = asString(value.serverInstanceId);
    const requestId = asString(value.requestId);
    const action = asString(value.action);
    const projectId = asString(value.projectId);
    if (!serverInstanceId || !requestId || !action || !projectId) return undefined;
    const state = value.state === undefined ? undefined : parseV2SessionState(value.state);
    return {
      type: "result",
      serverInstanceId,
      requestId,
      action,
      projectId,
      ...(asString(value.sessionId) ? { sessionId: asString(value.sessionId) } : {}),
      ...(state ? { state } : {}),
    };
  }
  if (value.type === "signal") {
    const sessionId = asString(value.sessionId);
    if (!sessionId) return undefined;
    if (value.signal === "thought" || value.signal === "answer") {
      const text = asString(value.text);
      if (text === undefined) return undefined;
      return { type: "signal", signal: value.signal, sessionId, text };
    }
    if (value.signal === "tool") {
      const id = asString(value.id);
      const title = asString(value.title);
      const status = asString(value.status);
      const text = asString(value.text);
      if (!id || title === undefined || status === undefined || text === undefined) return undefined;
      return { type: "signal", signal: "tool", sessionId, id, title, status, text };
    }
    if (value.signal === "tool/permission") {
      const permissionId = asString(value.permissionId);
      const title = asString(value.title);
      const text = asString(value.text);
      if (!permissionId || title === undefined || text === undefined) return undefined;
      return { type: "signal", signal: "tool/permission", sessionId, permissionId, title, text };
    }
  }
  return undefined;
}

export function encodeClientFrame(frame: V2ClientFrame): string {
  return JSON.stringify(frame);
}

export function v2ErrorMessage(error: V2Error): string {
  return `${error.code}: ${error.message}`;
}
