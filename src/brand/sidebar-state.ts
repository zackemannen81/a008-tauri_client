export const SIDEBAR_WIDTH_STORAGE_KEY = "a008.sidebar.width";
export const SIDEBAR_HIDDEN_STORAGE_KEY = "a008.sidebar.hidden";
export const MIN_SIDEBAR_WIDTH = 208;
export const MAX_SIDEBAR_WIDTH = 480;
export const DEFAULT_SIDEBAR_WIDTH = 280;
type StoragePort = Pick<Storage, "getItem" | "setItem">;
function storageOrDefault(storage?: StoragePort): StoragePort | undefined {
  try { return storage ?? globalThis.localStorage; } catch { return undefined; }
}
export function clampSidebarWidth(value: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, Math.round(value)));
}
export function readSidebarWidth(storage?: StoragePort): number {
  try { const raw = storageOrDefault(storage)?.getItem(SIDEBAR_WIDTH_STORAGE_KEY); if (!raw?.trim()) return DEFAULT_SIDEBAR_WIDTH; const value = Number(raw); return Number.isFinite(value) ? clampSidebarWidth(value) : DEFAULT_SIDEBAR_WIDTH; }
  catch { return DEFAULT_SIDEBAR_WIDTH; }
}
export function persistSidebarWidth(value: number, storage?: StoragePort): void {
  try { storageOrDefault(storage)?.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clampSidebarWidth(value))); } catch { /* storage is optional */ }
}
export function readSidebarHidden(storage?: StoragePort): boolean {
  try { return storageOrDefault(storage)?.getItem(SIDEBAR_HIDDEN_STORAGE_KEY) === "true"; }
  catch { return false; }
}
export function persistSidebarHidden(hidden: boolean, storage?: StoragePort): void {
  try { storageOrDefault(storage)?.setItem(SIDEBAR_HIDDEN_STORAGE_KEY, String(hidden)); } catch { /* storage is optional */ }
}
