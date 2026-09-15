import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fetchV2Ticket,
  loginWithPin,
  parseProjectListing,
  resolveHostEndpoints,
} from "./v2-http.js";

test("empty host uses the page origin so the Vite proxy stays same-origin", () => {
  const endpoints = resolveHostEndpoints("");
  assert.equal(endpoints.httpBase === "" || endpoints.httpBase.startsWith("http"), true);
  assert.equal(endpoints.wsUrl, "ws://127.0.0.1:8787/v2/session");
});

test("an explicit host builds matching HTTP and WebSocket URLs", () => {
  const endpoints = resolveHostEndpoints("http://127.0.0.1:8787");
  assert.equal(endpoints.httpBase, "http://127.0.0.1:8787");
  assert.equal(endpoints.wsUrl, "ws://127.0.0.1:8787/v2/session");
});

test("project listing keeps names, roots and the host current id", () => {
  const listing = parseProjectListing({
    currentId: "A008_v1_project_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    projects: [
      {
        projectId: "A008_v1_project_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        name: "oldschool",
        rootFolder: "c:\\code\\oldschool",
      },
    ],
  });
  assert.equal(listing.currentId?.endsWith("eeeeeeeeeeee"), true);
  assert.equal(listing.projects[0]?.name, "oldschool");
  assert.equal(listing.projects[0]?.rootFolder, "c:\\code\\oldschool");
});

test("PIN tickets omit Authorization so the host can use the cookie profile", async () => {
  let authorization: string | null = null;
  const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    authorization = headers.get("authorization");
    return new Response(
      JSON.stringify({
        serverInstanceId: "server_1",
        ticket: "t".repeat(32),
        expiresAt: 1,
        projectId: "A008_v1_project_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      }),
      { status: 200 },
    );
  }) as typeof fetch;
  await fetchV2Ticket(
    "http://127.0.0.1:8787",
    "",
    "A008_v1_project_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    fetchImpl,
  );
  assert.equal(authorization, null);
});

test("device tickets still send Bearer", async () => {
  let authorization: string | null = null;
  const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    authorization = new Headers(init?.headers).get("authorization");
    return new Response(
      JSON.stringify({
        serverInstanceId: "server_1",
        ticket: "t".repeat(32),
        expiresAt: 1,
        projectId: "A008_v1_project_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      }),
      { status: 200 },
    );
  }) as typeof fetch;
  await fetchV2Ticket(
    "http://127.0.0.1:8787",
    "secret",
    "A008_v1_project_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    fetchImpl,
  );
  assert.equal(authorization, "Bearer secret");
});

test("PIN login posts six digits and rejects short values before fetch", async () => {
  await assert.rejects(loginWithPin("", "12"), /six digits/);
  let body = "";
  const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    body = String(init?.body ?? "");
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;
  await loginWithPin("", "123456", fetchImpl);
  assert.equal(body, JSON.stringify({ pin: "123456" }));
});
