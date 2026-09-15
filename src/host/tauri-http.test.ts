import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultHttpBase, hostFetch, isTauriRuntime } from "./tauri-http.js";
import { resolveHostEndpoints } from "./v2-http.js";

test("Node tests are not a Tauri runtime", () => {
  assert.equal(isTauriRuntime(), false);
  assert.equal(defaultHttpBase() === "" || defaultHttpBase().startsWith("http"), true);
});

test("empty host keeps Vite same-origin HTTP in Node and always uses the A008 WebSocket", () => {
  const endpoints = resolveHostEndpoints("");
  assert.equal(endpoints.wsUrl, "ws://127.0.0.1:8787/v2/session");
  assert.equal(endpoints.httpBase === "" || endpoints.httpBase.startsWith("http"), true);
});

test("hostFetch without Tauri is ordinary fetch", async () => {
  let seen = "";
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    seen = String(input);
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  try {
    const response = await hostFetch("http://127.0.0.1:8787/v2/info");
    assert.equal(seen, "http://127.0.0.1:8787/v2/info");
    assert.equal(response.status, 200);
  } finally {
    globalThis.fetch = original;
  }
});
