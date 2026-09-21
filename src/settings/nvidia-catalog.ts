import {
  addNvidiaModelHttp,
  loadKieCatalog as loadKieFromHost,
  loadNvidiaCatalog as loadNvidiaFromHost,
  loadProviderSettings as loadSettingsFromHost,
  saveProviderSettings as saveSettingsToHost,
  type KieCatalog,
  type NvidiaCatalog,
  type ProviderSettings,
  type ProviderSettingsUpdate,
} from "../host/v1-http.js";

export type { KieCatalog, NvidiaCatalog, ProviderSettings, ProviderSettingsUpdate };

export async function loadNvidiaCatalog(signal?: AbortSignal, fetchImpl?: typeof fetch) {
  return loadNvidiaFromHost(signal, fetchImpl);
}

export async function addNvidiaModel(
  id: string,
  fetchImpl?: typeof fetch,
  provider = "nvidia",
): Promise<void> {
  return addNvidiaModelHttp(id, provider, fetchImpl);
}

export async function loadProviderSettings(signal?: AbortSignal, fetchImpl?: typeof fetch) {
  return loadSettingsFromHost(signal, fetchImpl);
}

export async function loadKieCatalog(signal?: AbortSignal, fetchImpl?: typeof fetch) {
  return loadKieFromHost(signal, fetchImpl);
}

export async function saveProviderSettings(body: ProviderSettingsUpdate, fetchImpl?: typeof fetch) {
  return saveSettingsToHost(body, fetchImpl);
}
