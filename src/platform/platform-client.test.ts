import assert from "node:assert/strict";
import { test } from "node:test";
import { createConversation, createRun, loadConversation, loadPlatform, listConversations, loadRun } from "./platform-client.js";

function mockFetch(routes: Record<string, unknown>, calls: { url: string; init?: RequestInit }[] = []): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input); calls.push({ url, init });
    const body = routes[url];
    if (body === undefined) return new Response(JSON.stringify({ error: { message: "missing" } }), { status: 404 });
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
}

test("Platform client discovers support and reads project conversations and runs", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = mockFetch({
    "/v3/info": { available: true },
    "/v1/projects": { projects: [{ projectId: "project-1", name: "Project" }] },
    "/v3/projects/project-1/conversations": { conversations: [{ id: "chat-1" }] },
    "/v3/conversations/chat-1": { conversation: { id: "chat-1" } },
    "/v3/runs/run-1": { run: { id: "run-1" } },
  }, calls);
  assert.equal((await loadPlatform(fetchImpl)).available, true);
  await listConversations("project-1", fetchImpl);
  await loadConversation("chat-1", fetchImpl);
  await loadRun("run-1", fetchImpl);
  assert.deepEqual(calls.map((call) => call.url), ["/v3/info", "/v1/projects", "/v3/projects/project-1/conversations", "/v3/conversations/chat-1", "/v3/runs/run-1"]);
});

test("Platform mutations carry the server revision and unique command id", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = mockFetch({
    "/v3/projects/p/conversations": { conversation: { id: "c", projectId: "p", revision: 12 } },
    "/v3/conversations/c/runs": { run: { id: "r", commandId: "cmd", revision: 13, status: "queued" } },
  }, calls);
  const conversation = await createConversation("p", "Title", "model", fetchImpl);
  await createRun(conversation, "hello", "model", "cmd", fetchImpl);
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), { title: "Title", model: "model" });
  assert.deepEqual(JSON.parse(String(calls[1]?.init?.body)), { commandId: "cmd", expectedRevision: 12, model: "model", text: "hello" });
});

test("Platform API rejects traversal-like identifiers before making requests", async () => {
  let calls = 0;
  const fetchImpl = (async () => { calls += 1; return new Response("{}", { status: 200 }); }) as typeof fetch;
  await assert.rejects(listConversations("..", fetchImpl), /invalid project id/i);
  assert.equal(calls, 0);
});
