import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ToolCall } from "../session/types.js";
import { displayToolStatus, groupToolCalls, ToolActivity } from "./tool-activity.js";

const tools: ToolCall[] = [
  { id: "1", title: "list_files", status: "completed", text: "root" },
  { id: "2", title: "list_files", status: "completed", text: "docs" },
  { id: "3", title: "read_file", status: "in_progress", text: "AGENTS.md" },
  { id: "4", title: "git", status: "failed", text: "failed" },
];

test("V2 tool statuses map to A008 display states", () => {
  assert.equal(displayToolStatus(tools[0]!), "ok");
  assert.equal(displayToolStatus(tools[2]!), "running");
  assert.equal(displayToolStatus({ id: "p", title: "x", status: "pending", text: "" }), "running");
  assert.equal(displayToolStatus(tools[3]!), "failed");
  assert.equal(displayToolStatus({ ...tools[3]!, recoveredBy: "retry-1" }), "recovered");
});

test("tool activity groups repeated calls by tool title", () => {
  const grouped = groupToolCalls(tools);
  assert.equal(grouped.get("list_files")?.length, 2);
  assert.equal(grouped.get("read_file")?.length, 1);
  assert.equal(grouped.get("git")?.length, 1);
});

test("tool activity renders grouped counts and status classes", () => {
  const html = renderToStaticMarkup(createElement(ToolActivity, { tools }));
  assert.match(html, /Tools · 4 calls · running/u);
  assert.match(html, /list_files ×2 · ✓ 2/u);
  assert.match(html, /read_file ×1/u);
  assert.match(html, /git ×1/u);
  assert.match(html, /a008-tool-ok/u);
  assert.match(html, /a008-tool-running/u);
  assert.match(html, /a008-tool-failed/u);
});
