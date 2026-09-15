export type AppThemeId = "neutral" | "deep-space";

export interface AppTheme {
  readonly id: AppThemeId;
  readonly name: string;
  readonly description: string;
}

export const DEFAULT_APP_THEME: AppThemeId = "neutral";
export const APP_THEME_ATTRIBUTE = "data-a008-theme";

export const APP_THEMES: readonly AppTheme[] = [
  {
    id: "neutral",
    name: "Neutral",
    description: "The current A008 charcoal surfaces.",
  },
  {
    id: "deep-space",
    name: "Deep Space",
    description: "Blue-black navy surfaces with restrained electric-blue interaction.",
  },
];

export function parseAppThemeId(value: unknown): AppThemeId {
  return value === "deep-space" ? "deep-space" : DEFAULT_APP_THEME;
}

export function applyAppTheme(
  id: AppThemeId,
  root?: { setAttribute(name: string, value: string): void } | null,
): void {
  const target = root ?? globalThis.document?.documentElement;
  target?.setAttribute(APP_THEME_ATTRIBUTE, parseAppThemeId(id));
}
