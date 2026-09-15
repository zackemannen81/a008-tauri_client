const DEFAULT_A008_HTTP = "http://127.0.0.1:8787";
export const DEFAULT_A008_WS = "ws://127.0.0.1:8787/v2/session";

export function isTauriRuntime(): boolean {
  return typeof globalThis !== "undefined" && "__TAURI_INTERNALS__" in globalThis;
}

export function defaultHttpBase(): string {
  if (isTauriRuntime()) return DEFAULT_A008_HTTP;
  return globalThis.location?.origin ?? "";
}

interface ProxyHttpResponse {
  readonly status: number;
  readonly headers: ReadonlyArray<readonly [string, string]>;
  readonly body: string;
}

async function tauriInvokeProxy(payload: {
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body?: string;
}): Promise<ProxyHttpResponse> {
  const internals = (globalThis as { __TAURI_INTERNALS__?: { invoke: (cmd: string, args: unknown) => Promise<unknown> } })
    .__TAURI_INTERNALS__;
  if (!internals?.invoke) {
    throw new Error("Tauri HTTP proxy is unavailable.");
  }
  const result = await internals.invoke("proxy_http", { request: payload });
  const record = result as ProxyHttpResponse;
  if (typeof record?.status !== "number" || !Array.isArray(record.headers) || typeof record.body !== "string") {
    throw new Error("Tauri HTTP proxy returned an invalid response.");
  }
  return record;
}

function headerRecord(headers: HeadersInit | undefined): Record<string, string> {
  const record: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export const hostFetch: typeof fetch = async (input, init = {}) => {
  if (!isTauriRuntime()) {
    return fetch(input, init);
  }
  const request = input instanceof Request ? input : new Request(input, init);
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  const proxied = await tauriInvokeProxy({
    method: request.method,
    url: request.url,
    headers: headerRecord(request.headers),
    ...(body === undefined || body === "" ? {} : { body }),
  });
  const headers = new Headers();
  for (const [name, value] of proxied.headers) headers.append(name, value);
  return new Response(proxied.body, {
    status: proxied.status,
    headers,
  });
};
