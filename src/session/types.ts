import type {
  SessionControl,
  V2Info,
  V2SessionState,
} from "../host/v2-types.js";

export type SessionStatus = "idle" | "connecting" | "ready" | "error";

export interface ToolCall {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly text: string;
}

export interface ToolPermission {
  readonly id: string;
  readonly title: string;
  readonly text: string;
}

export type ToolPermissionDecision = "reject" | "allow_once" | "allow_all";

export interface SessionSnapshot {
  readonly status: SessionStatus;
  readonly sessionId: string | undefined;
  readonly projectId: string | undefined;
  readonly serverInstanceId: string | undefined;
  readonly model: string;
  readonly thought: string;
  readonly answer: string;
  readonly error: string | undefined;
  readonly busy: boolean;
  readonly pendingText: string | undefined;
  readonly details: V2SessionState | undefined;
  readonly info: V2Info | undefined;
  readonly tools: readonly ToolCall[];
  readonly permission: ToolPermission | undefined;
}

export interface ClientSession extends SessionSnapshot {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  prompt(text: string): Promise<void>;
  cancel(): Promise<void>;
  controlSession(control: SessionControl): Promise<V2SessionState>;
  resolveToolPermission(decision: ToolPermissionDecision): void;
}

export interface GuiWebSocket {
  readonly readyState: number;
  send(data: string): void;
  close(): void;
  addEventListener(
    type: "open" | "message" | "error" | "close",
    listener: (event: { readonly data?: unknown }) => void,
  ): void;
  removeEventListener(
    type: "open" | "message" | "error" | "close",
    listener: (event: { readonly data?: unknown }) => void,
  ): void;
}

export type GuiWebSocketConstructor = new (
  url: string,
  protocols?: string | string[],
) => GuiWebSocket;
