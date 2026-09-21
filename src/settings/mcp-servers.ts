import {
  loadMcpServers as loadFromHost,
  saveMcpServers as saveToHost,
  type McpServer,
  type McpServerCatalog,
} from "../host/v1-http.js";

export type { McpServer, McpServerCatalog };

export async function loadMcpServers(
  signal?: AbortSignal,
  fetchImpl?: typeof fetch,
): Promise<McpServerCatalog> {
  return loadFromHost(signal, fetchImpl);
}

export async function saveMcpServers(
  servers: McpServerCatalog["servers"],
  fetchImpl?: typeof fetch,
): Promise<McpServerCatalog> {
  return saveToHost(servers, fetchImpl);
}
