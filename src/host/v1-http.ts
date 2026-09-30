import { defaultHttpBase, hostFetch } from "./tauri-http.js";

const SAME_ORIGIN: RequestInit = { cache: "no-store", credentials: "include" };

export const MEMORY_KINDS = [
  "entity",
  "state",
  "history",
  "claim",
  "event",
  "utterance",
  "artifact",
  "provenance",
] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];

export interface MemoryFilters {
  readonly query: string;
  readonly kind: string;
  readonly domain: string;
  readonly status: string;
  readonly offset: number;
}

export const EMPTY_MEMORY_FILTERS: MemoryFilters = {
  query: "",
  kind: "",
  domain: "",
  status: "",
  offset: 0,
};

export interface MemoryRecord {
  readonly id: string;
  readonly sourceId: string;
  readonly kind: MemoryKind;
  readonly label: string;
  readonly status: string;
  readonly activation: string;
  readonly tags: readonly string[];
  readonly domains: readonly string[];
  readonly storedDomains?: readonly string[];
  readonly effectiveDomains?: readonly string[];
  readonly primaryEffectiveDomain?: string | null;
  readonly detail: string;
  readonly truncated: boolean;
}

export interface MemoryEdge {
  readonly from: string;
  readonly to: string;
  readonly relation: string;
}

export interface MemorySnapshot {
  readonly protocol: "A008_MEMORY_INSPECT_V1";
  readonly projectId: string;
  readonly durable: boolean;
  readonly summary: {
    readonly total: number;
    readonly counts: Readonly<Record<MemoryKind, number>>;
    readonly active: number;
    readonly dormant: number;
    readonly contestedSlots: number;
    readonly domains: readonly { readonly name: string; readonly count: number }[];
    readonly statuses: readonly string[];
  };
  readonly records: readonly MemoryRecord[];
  readonly matched: number;
  readonly offset: number;
  readonly limit: number;
  readonly graph: {
    readonly nodes: readonly MemoryRecord[];
    readonly edges: readonly MemoryEdge[];
    readonly totalNodes: number;
    readonly totalEdges: number;
  };
}

export interface ShellHostResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly timedOut: boolean;
  readonly truncated: boolean;
}

export interface UploadedSource {
  readonly locator: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly mediaType: string;
  readonly extracted: boolean;
  readonly artifactId?: string;
}

export interface UploadableFile {
  readonly name: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface FrameCheck {
  readonly url: string;
  readonly embeddable: boolean;
  readonly reason?: string;
}

export interface GeneratedImage {
  readonly sha256: string;
  readonly filename: string;
  readonly mediaType?: string;
}

export interface McpServer {
  readonly name: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly env: readonly { readonly name: string; readonly value: string }[];
  readonly enabled: boolean;
}

export interface McpServerCatalog {
  readonly servers: readonly McpServer[];
}

export interface ProviderSettings {
  readonly nvidiaApiKeyConfigured: boolean;
  readonly kieApiKeyConfigured: boolean;
  readonly openAiApiKeyConfigured: boolean;
  readonly keySource: string;
  readonly kieKeySource: string;
  readonly openAiKeySource: string;
  readonly imageModel: string;
  readonly imageEndpoint: string;
  readonly chatProvider: "nvidia" | "kie" | "openai";
  readonly imageProvider: "nvidia" | "kie";
  readonly kieChatModel: string;
  readonly kieChatEndpoint: string;
  readonly kieImageModel: string;
}

export interface ProviderSettingsUpdate {
  readonly nvidiaApiKey?: string;
  readonly kieApiKey?: string;
  readonly openAiApiKey?: string;
  readonly imageModel?: string;
  readonly imageEndpoint?: string;
  readonly chatProvider?: "nvidia" | "kie" | "openai";
  readonly imageProvider?: "nvidia" | "kie";
  readonly kieChatModel?: string;
  readonly kieChatEndpoint?: string;
  readonly kieImageModel?: string;
}

export interface NvidiaCatalogModel {
  readonly id: string;
  readonly ownedBy: string;
  readonly added: boolean;
}

export interface NvidiaCatalog {
  readonly note: string;
  readonly models: readonly NvidiaCatalogModel[];
}

export interface KieCatalogModel {
  readonly id: string;
  readonly kind: "chat" | "image" | "video" | string;
  readonly added: boolean;
}

export interface KieCatalog {
  readonly note: string;
  readonly models: readonly KieCatalogModel[];
}

export class ShellCommandError extends Error {
  constructor(message: string, options?: { readonly cause?: unknown }) {
    super(message, options);
    this.name = "ShellCommandError";
  }
}

export class UploadError extends Error {
  constructor(message: string, options?: { readonly cause?: unknown }) {
    super(message, options);
    this.name = "UploadError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function joinUrl(base: string, path: string): string {
  const origin = base.trim() || defaultHttpBase();
  if (origin === "") return path;
  return `${origin.replace(/\/$/u, "")}${path}`;
}

function messageFromBody(body: unknown, fallback: string): string {
  if (isRecord(body) && typeof body.message === "string") return body.message;
  if (isRecord(body) && typeof body.error === "string") return body.error;
  return fallback;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === "") return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

async function requestJson(
  path: string,
  init: RequestInit = {},
  fetchImpl: typeof fetch = hostFetch,
): Promise<{ response: Response; body: unknown }> {
  const headers = new Headers(init.headers);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  const response = await fetchImpl(joinUrl("", path), { ...SAME_ORIGIN, ...init, headers });
  return { response, body: await readBody(response) };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseMemoryKind(value: unknown): MemoryKind | undefined {
  return MEMORY_KINDS.find((kind) => kind === value);
}

function parseMemoryRecord(value: unknown): MemoryRecord | undefined {
  if (!isRecord(value)) return undefined;
  const kind = parseMemoryKind(value.kind);
  const id = asString(value.id);
  const sourceId = asString(value.sourceId);
  const label = asString(value.label);
  const status = asString(value.status);
  const activation = asString(value.activation);
  const detail = asString(value.detail);
  if (!id || !sourceId || !kind || label === undefined || !status || !activation || detail === undefined) {
    return undefined;
  }
  return {
    id,
    sourceId,
    kind,
    label,
    status,
    activation,
    tags: asStringArray(value.tags),
    domains: asStringArray(value.domains),
    ...(Array.isArray(value.storedDomains) ? { storedDomains: asStringArray(value.storedDomains) } : {}),
    ...(Array.isArray(value.effectiveDomains)
      ? { effectiveDomains: asStringArray(value.effectiveDomains) }
      : {}),
    ...(value.primaryEffectiveDomain === null || typeof value.primaryEffectiveDomain === "string"
      ? { primaryEffectiveDomain: value.primaryEffectiveDomain }
      : {}),
    detail,
    truncated: value.truncated === true,
  };
}

export function parseMemorySnapshot(value: unknown): MemorySnapshot {
  if (!isRecord(value) || value.protocol !== "A008_MEMORY_INSPECT_V1") {
    throw new Error(
      "The host returned an incompatible memory response. Restart the host with the current A008 build.",
    );
  }
  const projectId = asString(value.projectId);
  const summary = isRecord(value.summary) ? value.summary : undefined;
  const graph = isRecord(value.graph) ? value.graph : undefined;
  if (!projectId || !summary || !graph || typeof value.durable !== "boolean") {
    throw new Error(
      "The host returned an incompatible memory response. Restart the host with the current A008 build.",
    );
  }
  const emptyCounts = Object.fromEntries(MEMORY_KINDS.map((kind) => [kind, 0])) as Record<MemoryKind, number>;
  const rawCounts = isRecord(summary.counts) ? summary.counts : {};
  const counts = { ...emptyCounts };
  for (const kind of MEMORY_KINDS) {
    counts[kind] = asNumber(rawCounts[kind]) ?? 0;
  }
  return {
    protocol: "A008_MEMORY_INSPECT_V1",
    projectId,
    durable: value.durable,
    summary: {
      total: asNumber(summary.total) ?? 0,
      counts,
      active: asNumber(summary.active) ?? 0,
      dormant: asNumber(summary.dormant) ?? 0,
      contestedSlots: asNumber(summary.contestedSlots) ?? 0,
      domains: Array.isArray(summary.domains)
        ? summary.domains.flatMap((entry) => {
            if (!isRecord(entry)) return [];
            const name = asString(entry.name);
            const count = asNumber(entry.count);
            return name === undefined || count === undefined ? [] : [{ name, count }];
          })
        : [],
      statuses: asStringArray(summary.statuses),
    },
    records: Array.isArray(value.records)
      ? value.records.flatMap((entry) => {
          const record = parseMemoryRecord(entry);
          return record ? [record] : [];
        })
      : [],
    matched: asNumber(value.matched) ?? 0,
    offset: asNumber(value.offset) ?? 0,
    limit: asNumber(value.limit) ?? 40,
    graph: {
      nodes: Array.isArray(graph.nodes)
        ? graph.nodes.flatMap((entry) => {
            const record = parseMemoryRecord(entry);
            return record ? [record] : [];
          })
        : [],
      edges: Array.isArray(graph.edges)
        ? graph.edges.flatMap((entry) => {
            if (!isRecord(entry)) return [];
            const from = asString(entry.from);
            const to = asString(entry.to);
            const relation = asString(entry.relation);
            return from && to && relation ? [{ from, to, relation }] : [];
          })
        : [],
      totalNodes: asNumber(graph.totalNodes) ?? 0,
      totalEdges: asNumber(graph.totalEdges) ?? 0,
    },
  };
}

export async function loadMemory(
  filters: MemoryFilters,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = hostFetch,
): Promise<MemorySnapshot> {
  const params = new URLSearchParams({ limit: "40", offset: String(filters.offset) });
  for (const key of ["query", "kind", "domain", "status"] as const) {
    if (filters[key]) params.set(key, filters[key]);
  }
  const { response, body } = await requestJson(
    `/v1/memory?${params.toString()}`,
    signal ? { signal } : {},
    fetchImpl,
  );
  if (body === undefined) {
    throw new Error("Memory inspection is unavailable. Check that the A008 GUI host is running.");
  }
  if (!response.ok) throw new Error(messageFromBody(body, "Memory inspection failed"));
  return parseMemorySnapshot(body);
}

export function parseShellHostResult(payload: unknown): ShellHostResult {
  if (!isRecord(payload)) throw new ShellCommandError("GUI host shell result must be a JSON object.");
  if (typeof payload.stdout !== "string" || typeof payload.stderr !== "string") {
    throw new ShellCommandError("GUI host shell result must include stdout and stderr strings.");
  }
  if (payload.exitCode !== null && (typeof payload.exitCode !== "number" || !Number.isSafeInteger(payload.exitCode))) {
    throw new ShellCommandError("GUI host shell result field 'exitCode' must be an integer or null.");
  }
  return {
    stdout: payload.stdout,
    stderr: payload.stderr,
    exitCode: payload.exitCode,
    timedOut: payload.timedOut === true,
    truncated: payload.truncated === true,
  };
}

export function formatShellHostResult(result: ShellHostResult): string {
  const lines = [`exit: ${result.exitCode ?? "null"}${result.timedOut ? " (timed out)" : ""}`];
  if (result.truncated) lines.push("output truncated");
  if (result.stdout.length > 0) {
    lines.push("stdout:", result.stdout.endsWith("\n") ? result.stdout.slice(0, -1) : result.stdout);
  }
  if (result.stderr.length > 0) {
    lines.push("stderr:", result.stderr.endsWith("\n") ? result.stderr.slice(0, -1) : result.stderr);
  }
  if (result.stdout.length === 0 && result.stderr.length === 0) lines.push("(no output)");
  return `${lines.join("\n")}\n`;
}

export async function executeShellCommand(
  command: string,
  fetchImpl: typeof fetch = hostFetch,
): Promise<ShellHostResult> {
  const normalized = command.trim();
  if (normalized.length === 0) throw new ShellCommandError("Terminal command must not be empty.");
  let response: Response;
  let body: unknown;
  try {
    ({ response, body } = await requestJson(
      "/v1/shell",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ command: normalized }),
      },
      fetchImpl,
    ));
  } catch (cause) {
    throw new ShellCommandError("Failed to reach the A008 GUI host shell.", { cause });
  }
  if (!response.ok) {
    throw new ShellCommandError(
      `GUI host shell failed (${String(response.status)}): ${messageFromBody(body, "shell failed")}`,
    );
  }
  if (body === undefined) throw new ShellCommandError("GUI host shell returned non-JSON.");
  return parseShellHostResult(body);
}

export function parseUploadedSource(payload: unknown): UploadedSource {
  if (!isRecord(payload)) throw new UploadError("A008 GUI host upload result must be a JSON object.");
  const locator = asString(payload.locator);
  const sha256 = asString(payload.sha256);
  const mediaType = asString(payload.mediaType);
  const bytes = asNumber(payload.bytes);
  if (!locator || !sha256 || !mediaType || bytes === undefined || typeof payload.extracted !== "boolean") {
    throw new UploadError("A008 GUI host upload result is incomplete.");
  }
  return {
    locator,
    sha256,
    bytes,
    mediaType,
    extracted: payload.extracted,
    ...(asString(payload.artifactId) ? { artifactId: asString(payload.artifactId) } : {}),
  };
}

export async function uploadSource(
  file: UploadableFile,
  fetchImpl: typeof fetch = hostFetch,
): Promise<UploadedSource> {
  const filename = file.name.trim();
  if (filename.length === 0) throw new UploadError("Select a file to upload.");
  let body: ArrayBuffer;
  try {
    body = await file.arrayBuffer();
  } catch (cause) {
    throw new UploadError("Could not read the selected file.", { cause });
  }
  let response: Response;
  let payload: unknown;
  try {
    ({ response, body: payload } = await requestJson(
      "/v1/upload",
      {
        method: "POST",
        headers: {
          "content-type": "application/octet-stream",
          "x-a008-filename": encodeURIComponent(filename),
        },
        body,
      },
      fetchImpl,
    ));
  } catch (cause) {
    throw new UploadError("Failed to reach the A008 GUI host upload route.", { cause });
  }
  if (!response.ok) {
    throw new UploadError(
      `A008 GUI host upload failed (${String(response.status)}): ${messageFromBody(payload, "upload failed")}`,
    );
  }
  if (payload === undefined) throw new UploadError("A008 GUI host upload route returned non-JSON.");
  return parseUploadedSource(payload);
}

export async function uploadSourcePath(
  localPath: string,
  fetchImpl: typeof fetch = hostFetch,
): Promise<UploadedSource> {
  const path = localPath.trim();
  if (path.length === 0) throw new UploadError("Enter an absolute local file path.");
  let response: Response;
  let payload: unknown;
  try {
    ({ response, body: payload } = await requestJson(
      "/v1/upload",
      {
        method: "POST",
        headers: {
          "content-type": "application/octet-stream",
          "x-a008-local-path": encodeURIComponent(path),
        },
      },
      fetchImpl,
    ));
  } catch (cause) {
    throw new UploadError("Failed to reach the A008 GUI host upload route.", { cause });
  }
  if (!response.ok) {
    throw new UploadError(
      `A008 GUI host upload failed (${String(response.status)}): ${messageFromBody(payload, "upload failed")}`,
    );
  }
  if (payload === undefined) throw new UploadError("A008 GUI host upload route returned non-JSON.");
  return parseUploadedSource(payload);
}

export async function checkFrame(url: string, fetchImpl: typeof fetch = hostFetch): Promise<FrameCheck> {
  const { response, body } = await requestJson(
    `/v1/browser/frame-check?url=${encodeURIComponent(url)}`,
    {},
    fetchImpl,
  );
  if (!response.ok) return { url, embeddable: true };
  if (!isRecord(body)) return { url, embeddable: true };
  return {
    url: asString(body.url) ?? url,
    embeddable: body.embeddable !== false,
    ...(asString(body.reason) ? { reason: asString(body.reason) } : {}),
  };
}

export function generatedImageSrc(image: GeneratedImage): string {
  return `${joinUrl("", `/v1/blobs/${image.sha256}/${encodeURIComponent(image.filename)}`)}`;
}

export function generatedImageLocatorSrc(locator: string): string | undefined {
  const match = /^source:([a-f0-9]{64})\/(.+)$/u.exec(locator.trim());
  if (match === null) return undefined;
  return joinUrl("", `/v1/blobs/${match[1]}/${encodeURIComponent(match[2]!)}`);
}

export async function generateImage(
  prompt: string,
  fetchImpl: typeof fetch = hostFetch,
): Promise<GeneratedImage> {
  const trimmed = prompt.trim();
  if (trimmed.length === 0) throw new Error("Describe the image to generate.");
  const { response, body } = await requestJson(
    "/v1/images",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: trimmed }),
    },
    fetchImpl,
  );
  if (!response.ok) throw new Error(messageFromBody(body, "Image generation failed"));
  if (!isRecord(body) || !asString(body.sha256) || !asString(body.filename)) {
    throw new Error("Image generation returned an incompatible payload.");
  }
  return {
    sha256: asString(body.sha256)!,
    filename: asString(body.filename)!,
    ...(asString(body.mediaType) ? { mediaType: asString(body.mediaType) } : {}),
  };
}

export async function loadMcpServers(
  signal?: AbortSignal,
  fetchImpl: typeof fetch = hostFetch,
): Promise<McpServerCatalog> {
  const { response, body } = await requestJson("/v1/mcp-servers", signal ? { signal } : {}, fetchImpl);
  if (!response.ok) throw new Error(messageFromBody(body, "Could not load MCP servers."));
  return parseMcpCatalog(body);
}

export async function saveMcpServers(
  servers: McpServerCatalog["servers"],
  fetchImpl: typeof fetch = hostFetch,
): Promise<McpServerCatalog> {
  const { response, body } = await requestJson(
    "/v1/mcp-servers",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ servers }),
    },
    fetchImpl,
  );
  if (!response.ok) throw new Error(messageFromBody(body, "Could not save MCP servers."));
  return parseMcpCatalog(body);
}

function parseMcpCatalog(body: unknown): McpServerCatalog {
  if (!isRecord(body) || !Array.isArray(body.servers)) return { servers: [] };
  const servers: McpServer[] = [];
  for (const entry of body.servers) {
    if (!isRecord(entry)) continue;
    const name = asString(entry.name);
    const command = asString(entry.command);
    if (!name || !command) continue;
    servers.push({
      name,
      command,
      args: asStringArray(entry.args),
      env: Array.isArray(entry.env)
        ? entry.env.flatMap((item) => {
            if (!isRecord(item)) return [];
            const envName = asString(item.name);
            const value = asString(item.value);
            return envName !== undefined && value !== undefined ? [{ name: envName, value }] : [];
          })
        : [],
      enabled: entry.enabled !== false,
    });
  }
  return { servers };
}

export async function loadProviderSettings(
  signal?: AbortSignal,
  fetchImpl: typeof fetch = hostFetch,
): Promise<ProviderSettings> {
  const { response, body } = await requestJson("/v1/provider-settings", signal ? { signal } : {}, fetchImpl);
  if (!response.ok) throw new Error(messageFromBody(body, "Could not load provider settings."));
  return parseProviderSettings(body);
}

export async function saveProviderSettings(
  update: ProviderSettingsUpdate,
  fetchImpl: typeof fetch = hostFetch,
): Promise<ProviderSettings> {
  const { response, body } = await requestJson(
    "/v1/provider-settings",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(update),
    },
    fetchImpl,
  );
  if (!response.ok) throw new Error(messageFromBody(body, "Could not save provider settings."));
  return parseProviderSettings(body);
}

function parseProviderSettings(body: unknown): ProviderSettings {
  const record = isRecord(body) ? body : {};
  const chat =
    record.chatProvider === "openai" || record.chatProvider === "kie" ? record.chatProvider : "nvidia";
  return {
    nvidiaApiKeyConfigured: record.nvidiaApiKeyConfigured === true,
    kieApiKeyConfigured: record.kieApiKeyConfigured === true,
    openAiApiKeyConfigured: record.openAiApiKeyConfigured === true,
    keySource: asString(record.keySource) ?? "missing",
    kieKeySource: asString(record.kieKeySource) ?? "missing",
    openAiKeySource: asString(record.openAiKeySource) ?? "missing",
    imageModel: asString(record.imageModel) ?? "",
    imageEndpoint: asString(record.imageEndpoint) ?? "",
    chatProvider: chat,
    imageProvider: record.imageProvider === "kie" ? "kie" : "nvidia",
    kieChatModel: asString(record.kieChatModel) ?? "",
    kieChatEndpoint: asString(record.kieChatEndpoint) ?? "",
    kieImageModel: asString(record.kieImageModel) ?? "",
  };
}

export async function loadNvidiaCatalog(
  signal?: AbortSignal,
  fetchImpl: typeof fetch = hostFetch,
): Promise<NvidiaCatalog> {
  const { response, body } = await requestJson("/v1/catalog/nvidia", signal ? { signal } : {}, fetchImpl);
  if (!response.ok) throw new Error(messageFromBody(body, "Could not load the NVIDIA catalog."));
  return parseNvidiaCatalog(body);
}

export async function addNvidiaModelHttp(
  id: string,
  provider = "nvidia",
  fetchImpl: typeof fetch = hostFetch,
): Promise<void> {
  const { response, body } = await requestJson(
    "/v1/catalog/nvidia",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, provider }),
    },
    fetchImpl,
  );
  if (!response.ok) throw new Error(messageFromBody(body, "Could not add that model."));
}

export async function loadKieCatalog(
  signal?: AbortSignal,
  fetchImpl: typeof fetch = hostFetch,
): Promise<KieCatalog> {
  const { response, body } = await requestJson("/v1/catalog/kie", signal ? { signal } : {}, fetchImpl);
  if (!response.ok) throw new Error(messageFromBody(body, "Could not load the kie.ai catalog."));
  return parseKieCatalog(body);
}

function parseNvidiaCatalog(body: unknown): NvidiaCatalog {
  if (!isRecord(body)) return { note: "", models: [] };
  return {
    note: asString(body.note) ?? "",
    models: Array.isArray(body.models)
      ? body.models.flatMap((entry) => {
          if (!isRecord(entry)) return [];
          const id = asString(entry.id);
          return id
            ? [{ id, ownedBy: asString(entry.ownedBy) ?? "", added: entry.added === true }]
            : [];
        })
      : [],
  };
}

function parseKieCatalog(body: unknown): KieCatalog {
  if (!isRecord(body)) return { note: "", models: [] };
  return {
    note: asString(body.note) ?? "",
    models: Array.isArray(body.models)
      ? body.models.flatMap((entry) => {
          if (!isRecord(entry)) return [];
          const id = asString(entry.id);
          return id
            ? [{ id, kind: asString(entry.kind) ?? "chat", added: entry.added === true }]
            : [];
        })
      : [],
  };
}
