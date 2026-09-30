import { hostFetch } from "../host/tauri-http.js";
export interface InstalledSkill { readonly id: string; readonly name: string; readonly description: string; readonly instructions: string; readonly sourcePath: string; }
export interface DiscoverableSkill extends Omit<InstalledSkill, "instructions"> { readonly installed: boolean; }
async function request<T>(path: string, init: RequestInit = {}, fetchImpl: typeof fetch = hostFetch): Promise<T> {
  const response = await fetchImpl(path, { cache: "no-store", credentials: "include", ...init });
  let body: unknown; try { body = await response.json(); } catch { body = undefined; }
  if (!response.ok) { const record = body as { message?: unknown; error?: { message?: unknown } } | undefined; throw new Error(typeof record?.message === "string" ? record.message : typeof record?.error?.message === "string" ? record.error.message : "Skill request failed."); }
  return body as T;
}
export async function loadInstalledSkills(fetchImpl: typeof fetch = hostFetch): Promise<readonly InstalledSkill[]> {
  return (await request<{ skills: readonly InstalledSkill[] }>("/v1/skills", {}, fetchImpl)).skills;
}
export async function discoverSkills(fetchImpl: typeof fetch = hostFetch): Promise<readonly DiscoverableSkill[]> {
  return (await request<{ skills: readonly DiscoverableSkill[] }>("/v1/skills/discover", { method: "POST" }, fetchImpl)).skills;
}
export async function installSkill(sourcePath: string, fetchImpl: typeof fetch = hostFetch): Promise<void> {
  await request("/v1/skills/install", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourcePath }) }, fetchImpl);
}
export async function removeSkill(id: string, fetchImpl: typeof fetch = hostFetch): Promise<void> {
  await request(`/v1/skills/${encodeURIComponent(id)}`, { method: "DELETE" }, fetchImpl);
}
