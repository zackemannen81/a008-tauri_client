export interface RuntimeBudgetField {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly description: string;
  readonly minimum: number;
  readonly maximum: number;
}

export interface RuntimePreferences {
  readonly instructions: string;
  readonly budgets: Readonly<Record<string, number>>;
  readonly semantic?: {
    readonly model: string;
    readonly reasoningEffort: string | null;
  };
}

export interface RuntimePreferencesSnapshot {
  readonly revision: string;
  readonly settings: RuntimePreferences;
  readonly defaults: RuntimePreferences;
  readonly fields: readonly RuntimeBudgetField[];
  readonly storagePath: string | null;
}

export function isRuntimePreferencesSnapshot(value: unknown): value is RuntimePreferencesSnapshot {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.revision === "string" && typeof record.settings === "object" && record.settings !== null;
}
