import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatShellHostResult,
  parseMemorySnapshot,
  parseShellHostResult,
  parseUploadedSource,
} from "./v1-http.js";

test("parses a memory inspection snapshot", () => {
  const snapshot = parseMemorySnapshot({
    protocol: "A008_MEMORY_INSPECT_V1",
    projectId: "project",
    durable: true,
    summary: {
      total: 1,
      counts: { entity: 1, state: 0, history: 0, claim: 0, event: 0, utterance: 0, artifact: 0, provenance: 0 },
      active: 1,
      dormant: 0,
      contestedSlots: 0,
      domains: [{ name: "demo", count: 1 }],
      statuses: ["active"],
    },
    records: [
      {
        id: "e1",
        sourceId: "s1",
        kind: "entity",
        label: "A008",
        status: "active",
        activation: "hot",
        tags: [],
        domains: ["demo"],
        detail: "client",
        truncated: false,
      },
    ],
    matched: 1,
    offset: 0,
    limit: 40,
    graph: { nodes: [], edges: [], totalNodes: 0, totalEdges: 0 },
  });
  assert.equal(snapshot.records[0]?.label, "A008");
  assert.equal(snapshot.summary.counts.entity, 1);
});

test("formats a shell host result", () => {
  const result = parseShellHostResult({
    stdout: "ok\n",
    stderr: "",
    exitCode: 0,
    timedOut: false,
    truncated: false,
  });
  assert.match(formatShellHostResult(result), /exit: 0/u);
  assert.match(formatShellHostResult(result), /stdout:\nok/u);
});

test("parses an upload result", () => {
  const uploaded = parseUploadedSource({
    locator: "source:abc/file.txt",
    sha256: "abc",
    bytes: 12,
    mediaType: "text/plain",
    extracted: true,
  });
  assert.equal(uploaded.extracted, true);
  assert.equal(uploaded.bytes, 12);
});
