export const CONNECTION_STORAGE_KEY = "a008.client.connection";
export const PREFERENCES_STORAGE_KEY = "a008.preferences";

export interface StoredConnection {
  readonly host: string;
  readonly projectId: string;
  readonly credential: string;
  readonly model: string;
  readonly projectName?: string;
}

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function store(storage?: Store): Store | undefined {
  try {
    return storage ?? globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function readStoredConnection(storage?: Store): StoredConnection | undefined {
  const current = store(storage);
  if (!current) return undefined;
  try {
    const raw = current.getItem(CONNECTION_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return undefined;
    const host = "host" in parsed && typeof parsed.host === "string" ? parsed.host : "";
    const projectId = "projectId" in parsed && typeof parsed.projectId === "string" ? parsed.projectId : "";
    const credential =
      "credential" in parsed && typeof parsed.credential === "string" ? parsed.credential : "";
    const model = "model" in parsed && typeof parsed.model === "string" ? parsed.model : "";
    const projectName =
      "projectName" in parsed && typeof parsed.projectName === "string" ? parsed.projectName : "";
    if (!projectId) return undefined;
    return { host, projectId, credential, model, ...(projectName ? { projectName } : {}) };
  } catch {
    return undefined;
  }
}

export function persistConnection(connection: StoredConnection, storage?: Store): void {
  const current = store(storage);
  if (!current) return;
  current.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(connection));
}

export function clearConnection(storage?: Store): void {
  store(storage)?.removeItem(CONNECTION_STORAGE_KEY);
}
