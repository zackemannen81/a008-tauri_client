import type { SessionParameters } from "./v2-types.js";

export interface GenerationCapabilities {
  readonly maxTokens: number;
  readonly topP: boolean;
  readonly thinking: boolean;
  readonly reasoningBudget: number | null;
  readonly reasoningEfforts: readonly string[];
  readonly seed: boolean;
  readonly stop: boolean;
}

export interface CatalogModel {
  readonly id: string;
  readonly name: string;
  readonly defaults: SessionParameters;
  readonly capabilities: GenerationCapabilities;
}

export const FALLBACK_CAPABILITIES: GenerationCapabilities = {
  maxTokens: 128_000,
  topP: true,
  thinking: true,
  reasoningBudget: 8192,
  reasoningEfforts: [],
  seed: true,
  stop: true,
};

export const FALLBACK_PARAMETERS: SessionParameters = {
  stream: true,
  temperature: null,
  topP: null,
  maxTokens: 4096,
  enableThinking: null,
  reasoningBudget: null,
  reasoningEffort: null,
  seed: null,
  stop: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function nullableNumber(value: unknown): number | null | undefined {
  if (value === null) return null;
  return asNumber(value);
}

function nullableBool(value: unknown): boolean | null | undefined {
  if (value === null) return null;
  return typeof value === "boolean" ? value : undefined;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" ? value : undefined;
}

export function parseSessionParameters(
  value: unknown,
  fallback: SessionParameters = FALLBACK_PARAMETERS,
): SessionParameters {
  if (!isRecord(value)) return fallback;
  const maxTokens = asNumber(value.maxTokens) ?? fallback.maxTokens;
  return {
    stream: typeof value.stream === "boolean" ? value.stream : fallback.stream,
    temperature: nullableNumber(value.temperature) ?? fallback.temperature,
    topP: nullableNumber(value.topP) ?? fallback.topP,
    maxTokens,
    enableThinking: nullableBool(value.enableThinking) ?? fallback.enableThinking,
    reasoningBudget: nullableNumber(value.reasoningBudget) ?? fallback.reasoningBudget,
    reasoningEffort: nullableString(value.reasoningEffort) ?? fallback.reasoningEffort,
    seed: nullableNumber(value.seed) ?? fallback.seed,
    stop: Array.isArray(value.stop)
      ? value.stop.filter((item): item is string => typeof item === "string")
      : value.stop === null
        ? null
        : fallback.stop,
  };
}

export function parseCapabilities(value: unknown): GenerationCapabilities {
  if (!isRecord(value)) return FALLBACK_CAPABILITIES;
  const efforts = Array.isArray(value.reasoningEfforts)
    ? value.reasoningEfforts.filter((item): item is string => typeof item === "string")
    : FALLBACK_CAPABILITIES.reasoningEfforts;
  return {
    maxTokens: asNumber(value.maxTokens) ?? FALLBACK_CAPABILITIES.maxTokens,
    topP: typeof value.topP === "boolean" ? value.topP : FALLBACK_CAPABILITIES.topP,
    thinking: typeof value.thinking === "boolean" ? value.thinking : FALLBACK_CAPABILITIES.thinking,
    reasoningBudget: nullableNumber(value.reasoningBudget) ?? FALLBACK_CAPABILITIES.reasoningBudget,
    reasoningEfforts: efforts,
    seed: typeof value.seed === "boolean" ? value.seed : FALLBACK_CAPABILITIES.seed,
    stop: typeof value.stop === "boolean" ? value.stop : FALLBACK_CAPABILITIES.stop,
  };
}

export function parseModelCatalog(body: unknown): readonly CatalogModel[] {
  if (!isRecord(body) || !Array.isArray(body.models)) return [];
  const models: CatalogModel[] = [];
  for (const entry of body.models) {
    if (!isRecord(entry) || typeof entry.id !== "string" || entry.id === "") continue;
    const name = typeof entry.name === "string" && entry.name !== "" ? entry.name : entry.id;
    models.push({
      id: entry.id,
      name,
      defaults: parseSessionParameters(entry.defaults),
      capabilities: parseCapabilities(entry.capabilities),
    });
  }
  return models;
}

export function modelOrFallback(
  models: readonly CatalogModel[],
  id: string,
  parameters?: SessionParameters,
): CatalogModel {
  const found = models.find((item) => item.id === id);
  if (found) {
    return parameters ? { ...found, defaults: parameters } : found;
  }
  return {
    id,
    name: id,
    defaults: parameters ?? FALLBACK_PARAMETERS,
    capabilities: FALLBACK_CAPABILITIES,
  };
}
