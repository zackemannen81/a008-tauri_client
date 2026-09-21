import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPreviewDocument,
  htmlArtifactFromAnswer,
  parseAssistantAnswer,
} from "./code-artifact.js";

test("parses fenced HTML as a canvas candidate", () => {
  const segments = parseAssistantAnswer("Intro\n```html\n<html></html>\n```\nOutro");
  assert.equal(segments[0]?.kind, "text");
  assert.equal(segments[1]?.kind, "code");
  if (segments[1]?.kind === "code") {
    assert.equal(segments[1].language, "html");
    assert.equal(segments[1].artifactEligible, true);
  }
  const artifact = htmlArtifactFromAnswer("```html\n<body>Hi</body>\n```", "turn-1");
  assert.equal(artifact?.sourceTurnId, "turn-1");
  assert.equal(artifact?.source.includes("Hi"), true);
});

test("preview document disables network APIs", () => {
  const document = buildPreviewDocument("<p>ok</p>");
  assert.equal(document.includes("Content-Security-Policy"), true);
  assert.equal(document.includes("connect-src 'none'"), true);
  assert.equal(document.includes("A008 preview network access is disabled"), true);
});
