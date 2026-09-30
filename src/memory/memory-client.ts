import {
  EMPTY_MEMORY_FILTERS,
  loadMemory as loadMemoryFromHost,
  MEMORY_KINDS,
  parseMemorySnapshot,
  type MemoryEdge,
  type MemoryFilters,
  type MemoryKind,
  type MemoryRecord,
  type MemorySnapshot,
} from "../host/v1-http.js";

export {
  MEMORY_KINDS,
  parseMemorySnapshot,
  type MemoryEdge,
  type MemoryFilters,
  type MemoryKind,
  type MemoryRecord,
  type MemorySnapshot,
};

export const EMPTY_FILTERS: MemoryFilters = EMPTY_MEMORY_FILTERS;
export const KIND_LABEL: Readonly<Record<MemoryKind, string>> = {
  entity: "Entities",
  state: "Current state",
  history: "History",
  claim: "Claims",
  event: "Events",
  utterance: "Utterances",
  artifact: "Artifacts",
  provenance: "Provenance",
};

export async function loadMemory(
  filters: MemoryFilters,
  signal: AbortSignal,
  fetcher?: typeof fetch,
): Promise<MemorySnapshot> {
  return loadMemoryFromHost(filters, signal, fetcher);
}
