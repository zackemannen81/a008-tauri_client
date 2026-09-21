import { useId, useState, type FormEvent } from "react";
import type { CatalogModel, GenerationCapabilities } from "../host/model-catalog.js";
import type { SessionParameters } from "../host/v2-types.js";
import type { ClientSession } from "../session/types.js";

const numberValue = (value: number | null): number | "" =>
  value !== null && Number.isFinite(value) ? value : "";

function Toggle(props: {
  readonly label: string;
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <label className="a008-parameter-toggle">
      <span>{props.label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.currentTarget.checked)}
      />
    </label>
  );
}

function Sampling(props: {
  readonly label: string;
  readonly value: number | null;
  readonly fallback: number;
  readonly onChange: (value: number | null) => void;
}) {
  const id = useId();
  return (
    <div className="a008-parameter-group">
      <Toggle
        label={props.label}
        checked={props.value !== null}
        onChange={(on) => props.onChange(on ? props.fallback : null)}
      />
      <div className="a008-parameter-slider">
        <input
          aria-label={`${props.label} slider`}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={props.value !== null && Number.isFinite(props.value) ? props.value : props.fallback}
          disabled={props.value === null}
          onChange={(event) => props.onChange(Number(event.currentTarget.value))}
        />
        <input
          id={id}
          aria-label={`${props.label} value`}
          type="number"
          min="0"
          max="1"
          step="0.01"
          required
          value={numberValue(props.value)}
          disabled={props.value === null}
          onChange={(event) => props.onChange(event.currentTarget.valueAsNumber)}
        />
      </div>
      <p>
        {props.value === null
          ? "Omitted from the request; provider default applies."
          : "0 · focused                         1 · varied"}
      </p>
    </div>
  );
}

export function ModelParameterForm(props: {
  readonly session: ClientSession;
  readonly model: CatalogModel;
  readonly initial: SessionParameters;
}) {
  const { session, model } = props;
  const caps: GenerationCapabilities = model.capabilities;
  const [draft, setDraft] = useState<SessionParameters>(() => ({ ...props.initial }));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof SessionParameters>(key: K, value: SessionParameters[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice("");
    setError("");
  }

  async function apply(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const state = await session.controlSession({ action: "configure", parameters: draft });
      setDraft({ ...state.parameters });
      setNotice("Applied to the next chat message.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not apply parameters.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="a008-parameter-form"
      onSubmit={(event) => {
        void apply(event);
      }}
    >
      <fieldset disabled={saving || session.busy || session.status !== "ready"}>
        <Toggle label="Stream" checked={draft.stream} onChange={(value) => update("stream", value)} />
        <div className="a008-parameter-group">
          {caps.thinking ? (
            <Toggle
              label="Reasoning"
              checked={draft.enableThinking !== false}
              onChange={(value) => update("enableThinking", value)}
            />
          ) : (
            <h3>Reasoning effort</h3>
          )}
          {caps.reasoningEfforts.length > 0 ? (
            <div className="a008-effort-options" role="group" aria-label="Reasoning effort">
              <label>
                <input
                  type="radio"
                  name="effort"
                  checked={draft.reasoningEffort === null}
                  onChange={() => update("reasoningEffort", null)}
                />
                Default
              </label>
              {caps.reasoningEfforts.map((effort) => (
                <label key={effort}>
                  <input
                    type="radio"
                    name="effort"
                    checked={draft.reasoningEffort === effort}
                    onChange={() => update("reasoningEffort", effort)}
                  />
                  {effort === "none" ? "None (off)" : effort}
                </label>
              ))}
            </div>
          ) : !caps.thinking ? (
            <p>This endpoint exposes no reasoning control.</p>
          ) : null}
          {caps.reasoningBudget !== null ? (
            <div className="a008-reasoning-budget">
              <Toggle
                label="Set reasoning budget"
                checked={draft.reasoningBudget !== null}
                disabled={draft.enableThinking === false}
                onChange={(on) =>
                  update("reasoningBudget", on ? Math.min(4096, draft.maxTokens) : null)
                }
              />
              <input
                aria-label="Reasoning budget"
                type="number"
                min="-1"
                max={caps.reasoningBudget}
                step="1"
                required
                disabled={draft.enableThinking === false || draft.reasoningBudget === null}
                value={numberValue(draft.reasoningBudget)}
                onChange={(event) => update("reasoningBudget", event.currentTarget.valueAsNumber)}
              />
              <p>Part of the total budget below. −1 removes the reasoning cap.</p>
            </div>
          ) : null}
        </div>
        <Sampling
          label="Temperature"
          value={draft.temperature}
          fallback={model.defaults.temperature ?? 1}
          onChange={(value) => update("temperature", value)}
        />
        {caps.topP ? (
          <Sampling
            label="Top P"
            value={draft.topP}
            fallback={model.defaults.topP ?? 0.95}
            onChange={(value) => update("topP", value)}
          />
        ) : (
          <div className="a008-parameter-group">
            <h3>Top P</h3>
            <p>Fixed by this model; no request override.</p>
          </div>
        )}
        <div className="a008-parameter-group">
          <label>
            Total token budget
            <input
              aria-label="Total token budget"
              type="number"
              required
              min="1"
              max={caps.maxTokens}
              step="1"
              value={numberValue(draft.maxTokens)}
              onChange={(event) => update("maxTokens", event.currentTarget.valueAsNumber)}
            />
          </label>
          <p>
            Maximum generated tokens per chat call: reasoning + answer. Excludes input tokens and
            memory processing. Limit: {caps.maxTokens.toLocaleString()}.
          </p>
        </div>
        {caps.seed ? (
          <div className="a008-parameter-group">
            <Toggle
              label="Seed"
              checked={draft.seed !== null}
              onChange={(on) => update("seed", on ? 42 : null)}
            />
            <input
              aria-label="Seed value"
              type="number"
              min="0"
              max={Number.MAX_SAFE_INTEGER}
              step="1"
              required
              disabled={draft.seed === null}
              value={numberValue(draft.seed)}
              onChange={(event) => update("seed", event.currentTarget.valueAsNumber)}
            />
            <p>Optional reproducibility hint; identical output is not guaranteed.</p>
          </div>
        ) : null}
        {caps.stop ? (
          <div className="a008-parameter-group">
            <label>
              Stop sequences
              <textarea
                aria-label="Stop sequences"
                rows={3}
                value={draft.stop?.join("\n") ?? ""}
                onChange={(event) =>
                  update(
                    "stop",
                    event.currentTarget.value === "" ? null : event.currentTarget.value.split("\n"),
                  )
                }
              />
            </label>
            <p>One per line, up to four. Empty means no custom stop.</p>
          </div>
        ) : null}
        <div className="a008-parameter-actions">
          <button
            type="button"
            onClick={() => {
              setDraft({ ...model.defaults });
              setNotice("Model defaults loaded. Apply to use them.");
              setError("");
            }}
          >
            Model defaults
          </button>
          <button type="submit" className="a008-parameter-apply">
            {saving ? "Applying…" : "Apply parameters"}
          </button>
        </div>
      </fieldset>
      {error ? (
        <p className="a008-parameter-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="a008-parameter-success" role="status">
          {notice}
        </p>
      ) : null}
      <p className="a008-parameter-footnote">
        Settings belong to this V2 session. A model change or new session loads runtime defaults.
      </p>
    </form>
  );
}
