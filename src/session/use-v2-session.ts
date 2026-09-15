import { useEffect, useRef, useSyncExternalStore } from "react";
import { createV2SessionClient, type V2SessionClient } from "../host/v2-session-client.js";
import { DEFAULT_MODEL } from "../host/v2-types.js";
import { readStoredConnection } from "../host/storage.js";
import type { ClientSession } from "./types.js";

function settle(run: () => Promise<void>): () => Promise<void> {
  return () =>
    run().then(
      () => undefined,
      () => undefined,
    );
}

export function useV2Session(): ClientSession & {
  configure(options: {
    host?: string;
    credential?: string;
    projectId: string;
    model?: string;
  }): void;
} {
  const clientRef = useRef<V2SessionClient | undefined>(undefined);
  if (clientRef.current === undefined) {
    const stored = readStoredConnection();
    clientRef.current = createV2SessionClient({
      host: stored?.host ?? "",
      credential: stored?.credential ?? "",
      projectId: stored?.projectId ?? "",
      model: stored?.model || DEFAULT_MODEL,
    });
  }
  const client = clientRef.current;
  useEffect(() => () => client.dispose(), [client]);
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);
  const connectRef = useRef<(() => Promise<void>) | undefined>(undefined);
  if (connectRef.current === undefined) connectRef.current = settle(client.connect);
  const disconnectRef = useRef<(() => Promise<void>) | undefined>(undefined);
  if (disconnectRef.current === undefined) disconnectRef.current = settle(client.disconnect);

  return {
    ...snapshot,
    configure: (options) => client.configure(options),
    resolveToolPermission: (decision) => client.resolveToolPermission(decision),
    controlSession: (control) => client.controlSession(control),
    connect: connectRef.current,
    disconnect: disconnectRef.current,
    prompt: (text) => client.prompt(text),
    cancel: () => client.cancel(),
  };
}
