import {
  defaultHttpBase,
  DEFAULT_A008_WS,
  hostFetch,
} from "./tauri-http.js";
import {
  parseV2Error,
  parseV2Info,
  parseV2Ticket,
  v2ErrorMessage,
  type V2Info,
  type V2Ticket,
} from "./v2-types.js";

export class V2HttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "V2HttpError";
    this.status = status;
    this.code = code;
  }
}

export interface HostEndpoints {
  readonly httpBase: string;
  readonly wsUrl: string;
}

export function resolveHostEndpoints(host: string): HostEndpoints {
  const trimmed = host.trim();
  if (trimmed === "") {
    return {
      httpBase: defaultHttpBase(),
      wsUrl: DEFAULT_A008_WS,
    };
  }
  const url = new URL(trimmed);
  const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
  return {
    httpBase: url.origin,
    wsUrl: `${wsProtocol}//${url.host}/v2/session`,
  };
}

const SAME_ORIGIN: RequestInit = { cache: "no-store", credentials: "include" };

function joinUrl(base: string, path: string): string {
  if (base === "") return path;
  return `${base.replace(/\/$/u, "")}${path}`;
}

function v1ErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
    return body.message;
  }
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return fallback;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === "") return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function throwV2Failure(status: number, body: unknown, fallback: string): never {
  const error = parseV2Error(body);
  if (error) throw new V2HttpError(status, error.code, v2ErrorMessage(error));
  throw new V2HttpError(status, "RUNTIME_FAILED", fallback);
}

export async function fetchV2Info(
  httpBase: string,
  fetchImpl: typeof fetch = hostFetch,
): Promise<V2Info> {
  const response = await fetchImpl(joinUrl(httpBase, "/v2/info"), {
    ...SAME_ORIGIN,
    headers: { accept: "application/json" },
  });
  const body = await readBody(response);
  if (!response.ok) throwV2Failure(response.status, body, `Discovery failed (${response.status}).`);
  const info = parseV2Info(body);
  if (!info) throw new V2HttpError(502, "RUNTIME_FAILED", "Host /v2/info was not a V2 discovery document.");
  return info;
}

export async function loginWithPin(
  httpBase: string,
  pin: string,
  fetchImpl: typeof fetch = hostFetch,
): Promise<void> {
  const trimmed = pin.trim();
  if (!/^\d{6}$/u.test(trimmed)) {
    throw new V2HttpError(400, "INVALID_REQUEST", "PIN must be six digits.");
  }
  const response = await fetchImpl(joinUrl(httpBase, "/auth/login"), {
    ...SAME_ORIGIN,
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ pin: trimmed }),
  });
  const body = await readBody(response);
  if (!response.ok) {
    throw new V2HttpError(
      response.status,
      response.status === 429 ? "CAPACITY_EXCEEDED" : "UNAUTHENTICATED",
      v1ErrorMessage(body, `PIN login failed (${String(response.status)}).`),
    );
  }
}

export async function fetchV2Ticket(
  httpBase: string,
  credential: string,
  projectId: string,
  fetchImpl: typeof fetch = hostFetch,
): Promise<V2Ticket> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };
  if (credential.trim() !== "") headers.authorization = `Bearer ${credential.trim()}`;
  const response = await fetchImpl(joinUrl(httpBase, "/v2/auth/ticket"), {
    ...SAME_ORIGIN,
    method: "POST",
    headers,
    body: JSON.stringify({ projectId }),
  });
  const body = await readBody(response);
  if (!response.ok) throwV2Failure(response.status, body, `Ticket request failed (${response.status}).`);
  const ticket = parseV2Ticket(body);
  if (!ticket) throw new V2HttpError(502, "RUNTIME_FAILED", "Host returned an invalid V2 ticket.");
  return ticket;
}

export interface ListedProject {
  readonly projectId: string;
  readonly name: string;
  readonly rootFolder?: string;
}

export interface ProjectListing {
  readonly currentId: string | null;
  readonly projects: readonly ListedProject[];
}

export interface ListedModel {
  readonly id: string;
  readonly name: string;
}

export function parseProjectListing(body: unknown): ProjectListing {
  if (!body || typeof body !== "object" || !("projects" in body) || !Array.isArray(body.projects)) {
    return { currentId: null, projects: [] };
  }
  const currentId =
    "currentId" in body && typeof body.currentId === "string" ? body.currentId : null;
  const projects: ListedProject[] = [];
  for (const entry of body.projects) {
    if (!entry || typeof entry !== "object") continue;
    const projectId = "projectId" in entry && typeof entry.projectId === "string" ? entry.projectId : "";
    const name = "name" in entry && typeof entry.name === "string" ? entry.name : projectId;
    const rootFolder =
      "rootFolder" in entry && typeof entry.rootFolder === "string" ? entry.rootFolder : undefined;
    if (!projectId) continue;
    projects.push({ projectId, name, ...(rootFolder ? { rootFolder } : {}) });
  }
  return { currentId, projects };
}

function parseModels(body: unknown): readonly ListedModel[] {
  if (!body || typeof body !== "object" || !("models" in body) || !Array.isArray(body.models)) {
    return [];
  }
  return body.models.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const id = "id" in entry && typeof entry.id === "string" ? entry.id : "";
    const name = "name" in entry && typeof entry.name === "string" ? entry.name : id;
    if (!id) return [];
    return [{ id, name }];
  });
}

/** Best-effort V1 reads. Fail closed without throwing into the V2 session path. */
export async function tryListProjects(
  httpBase: string,
  fetchImpl: typeof fetch = hostFetch,
): Promise<ProjectListing | undefined> {
  try {
    const response = await fetchImpl(joinUrl(httpBase, "/v1/projects"), {
      ...SAME_ORIGIN,
      headers: { accept: "application/json" },
    });
    if (response.status === 401) return undefined;
    if (!response.ok) return undefined;
    return parseProjectListing(await readBody(response));
  } catch {
    return undefined;
  }
}

export async function tryListModels(
  httpBase: string,
  fetchImpl: typeof fetch = hostFetch,
): Promise<readonly ListedModel[] | undefined> {
  try {
    const response = await fetchImpl(joinUrl(httpBase, "/v1/models"), {
      ...SAME_ORIGIN,
      headers: { accept: "application/json" },
    });
    if (!response.ok) return undefined;
    return parseModels(await readBody(response));
  } catch {
    return undefined;
  }
}
