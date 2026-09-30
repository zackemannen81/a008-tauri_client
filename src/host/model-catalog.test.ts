import assert from "node:assert/strict";
import { test } from "node:test";
import { modelOrFallback, parseModelCatalog } from "./model-catalog.js";

test("model catalog keeps id, name, defaults and capabilities", () => {
  const models = parseModelCatalog({
    models: [
      {
        id: "gpt-5.6-luna",
        name: "Luna",
        defaults: {
          stream: true,
          temperature: null,
          topP: null,
          maxTokens: 8192,
          enableThinking: true,
          reasoningBudget: null,
          reasoningEffort: null,
          seed: null,
          stop: null,
        },
        capabilities: {
          maxTokens: 128000,
          topP: false,
          thinking: true,
          reasoningBudget: 4096,
          reasoningEfforts: ["none", "high"],
          seed: false,
          stop: true,
          verifiedOn: "ignored",
        },
      },
    ],
  });
  assert.equal(models[0]?.id, "gpt-5.6-luna");
  assert.equal(models[0]?.name, "Luna");
  assert.equal(models[0]?.defaults.maxTokens, 8192);
  assert.equal(models[0]?.capabilities.topP, false);
  assert.deepEqual(models[0]?.capabilities.reasoningEfforts, ["none", "high"]);
});

test("thin model rows still produce a usable catalog entry", () => {
  const models = parseModelCatalog({ models: [{ id: "only-id" }] });
  assert.equal(models[0]?.name, "only-id");
  assert.equal(models[0]?.capabilities.thinking, true);
});

test("unknown model id falls back without inventing a different id", () => {
  const model = modelOrFallback([], "nvidia/nemotron-3.5-lightning-30b-a3b");
  assert.equal(model.id, "nvidia/nemotron-3.5-lightning-30b-a3b");
  assert.equal(model.defaults.stream, true);
});
