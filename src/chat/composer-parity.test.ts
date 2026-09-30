import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ClientSession } from "../session/types.js";
import { Composer } from "./composer.js";

const session = {
  status: "ready",
  sessionId: "session-1",
  projectId: "project-1",
  serverInstanceId: "server-1",
  model: "gpt-5.6-luna",
  thought: "",
  answer: "",
  error: undefined,
  busy: false,
  pendingText: undefined,
  details: undefined,
  info: undefined,
  tools: [],
  permission: undefined,
  connect: async () => undefined,
  disconnect: async () => undefined,
  prompt: async () => undefined,
  cancel: async () => undefined,
  controlSession: async () => {
    throw new Error("not used while rendering");
  },
  resolveToolPermission: () => undefined,
} as unknown as ClientSession;

test("composer exposes the reference session controls", () => {
  const html = renderToStaticMarkup(
    createElement(Composer, {
      session,
      httpBase: "http://127.0.0.1:8787",
      onParameters() {},
    }),
  );

  assert.match(html, /aria-label="Session commands"/u);
  assert.match(html, />Undo</u);
  assert.match(html, />Reset</u);
  assert.match(html, /Shell command \/shell/u);
  assert.match(html, /Generate image/u);
});
