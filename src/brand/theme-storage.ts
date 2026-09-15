import {
  applyAppTheme,
  DEFAULT_APP_THEME,
  parseAppThemeId,
  type AppThemeId,
} from "./theme.js";
import { PREFERENCES_STORAGE_KEY } from "../host/storage.js";

type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

function readPreferenceObject(storage: PreferenceStorage): Record<string, unknown> {
  try {
    const raw = storage.getItem(PREFERENCES_STORAGE_KEY);
    if (raw === null || raw === "") return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function readStoredAppTheme(storage?: PreferenceStorage): AppThemeId {
  try {
    const store = storage ?? globalThis.localStorage;
    if (!store) return DEFAULT_APP_THEME;
    const appearance = readPreferenceObject(store).appearance;
    if (appearance === null || typeof appearance !== "object" || Array.isArray(appearance)) {
      return DEFAULT_APP_THEME;
    }
    return parseAppThemeId((appearance as { readonly theme?: unknown }).theme);
  } catch {
    return DEFAULT_APP_THEME;
  }
}

export function persistAppTheme(id: AppThemeId, storage?: PreferenceStorage): void {
  try {
    const store = storage ?? globalThis.localStorage;
    if (!store) return;
    const current = readPreferenceObject(store);
    const previous = current.appearance;
    const appearance =
      previous !== null && typeof previous === "object" && !Array.isArray(previous)
        ? { ...(previous as Record<string, unknown>), theme: parseAppThemeId(id) }
        : { theme: parseAppThemeId(id) };
    store.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ ...current, appearance }));
  } catch {
    /* private mode */
  }
}

export function selectAppTheme(
  id: AppThemeId,
  options?: {
    storage?: PreferenceStorage;
    root?: { setAttribute(name: string, value: string): void } | null;
  },
): AppThemeId {
  const theme = parseAppThemeId(id);
  persistAppTheme(theme, options?.storage);
  applyAppTheme(theme, options?.root);
  return theme;
}
