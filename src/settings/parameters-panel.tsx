import { useEffect, useRef, useState } from "react";
import { APP_THEMES, type AppThemeId } from "../brand/theme.js";
import { readStoredAppTheme, selectAppTheme } from "../brand/theme-storage.js";
import { modelOrFallback, type CatalogModel } from "../host/model-catalog.js";
import { tryListModels } from "../host/v2-http.js";
import type { RuntimePreferencesSnapshot } from "../host/v2-types.js";
import type { ClientSession } from "../session/types.js";
import { GlobalSettingsForm } from "./global-settings-form.js";
import { McpServersPanel } from "./mcp-servers-panel.js";
import { ModelParameterForm } from "./model-form.js";
import { NvidiaCatalogPanel } from "./nvidia-catalog-panel.js";
import { RuntimeCapabilitiesPanel } from "./runtime-capabilities-panel.js";
import { SkillsPanel } from "./skills-panel.js";
import { ZeroCostRadarPanel } from "./zero-cost-radar-panel.js";
import "./parameters.css";

type ParameterPage =
  | "model"
  | "semantic"
  | "provider"
  | "mcp"
  | "runtime"
  | "budgets"
  | "instructions"
  | "appearance"
  | "skills"
  | "radar";

const PARAMETER_TABS: readonly { id: ParameterPage; label: string }[] = [
  { id: "model", label: "Model" },
  { id: "semantic", label: "Semantic" },
  { id: "provider", label: "Provider" },
  { id: "mcp", label: "MCP" },
  { id: "runtime", label: "Runtime" },
  { id: "budgets", label: "Budgets" },
  { id: "instructions", label: "Instructions" },
  { id: "appearance", label: "Appearance" },
  { id: "skills", label: "Skills" },
  { id: "radar", label: "Zero Cost" },
];

function emptyRuntimePreferences(model: string): RuntimePreferencesSnapshot {
  return {
    revision: "",
    settings: { instructions: "", budgets: {}, semantic: { model, reasoningEffort: null } },
    defaults: { instructions: "", budgets: {}, semantic: { model, reasoningEffort: null } },
    fields: [],
    storagePath: null,
  };
}

export function ParametersPanel(props: {
  readonly open: boolean;
  readonly session: ClientSession;
  readonly httpBase: string;
  readonly onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [theme, setTheme] = useState<AppThemeId>(() => readStoredAppTheme());
  const [models, setModels] = useState<readonly CatalogModel[]>([]);
  const [page, setPage] = useState<ParameterPage>("model");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const connected = props.session.status === "ready";
  const model = modelOrFallback(
    models,
    props.session.model,
    props.session.details?.parameters,
  );

  useEffect(() => {
    if (props.open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [props.open]);

  useEffect(() => {
    if (!props.open) return;
    const abort = new AbortController();
    void tryListModels(props.httpBase).then((listed) => {
      if (!abort.signal.aborted && listed) setModels(listed);
    });
    return () => abort.abort();
  }, [props.open, props.httpBase]);

  async function reset(): Promise<void> {
    setNotice("");
    setError("");
    try {
      await props.session.controlSession({ action: "reset" });
      setNotice("Conversation cleared. Saved memory remains.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reset failed.");
    }
  }

  async function undo(): Promise<void> {
    setNotice("");
    setError("");
    try {
      const state = await props.session.controlSession({ action: "undo" });
      setNotice(state.undone ? "Last turn undone." : "Nothing to undo.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Undo failed.");
    }
  }

  async function changeModel(next: string): Promise<void> {
    if (!next || next === props.session.model) return;
    setNotice("");
    setError("");
    try {
      await props.session.controlSession({ action: "model", model: next });
      setNotice(`Model: ${next}. New conversation started with this model's runtime defaults.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Model change failed.");
    }
  }

  return (
    <dialog
      ref={dialog}
      className="a008-parameters"
      aria-label="Parameters"
      onClose={props.onClose}
      onCancel={props.onClose}
    >
      <header>
        <div>
          <p>Chat configuration</p>
          <h2>Parameters</h2>
        </div>
        <button type="button" aria-label="Close parameters" onClick={props.onClose}>
          Ã—
        </button>
      </header>
      <div className="a008-parameters-body">
        <nav className="a008-parameter-tabs" aria-label="Parameter sections">
          {PARAMETER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={page === tab.id}
              onClick={() => setPage(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div hidden={page !== "model"}>
          <label className="a008-model-select">
            Model
            <select
              aria-label="Selected model"
              value={props.session.model}
              disabled={!connected || props.session.busy}
              onChange={(event) => void changeModel(event.currentTarget.value)}
            >
              {models.some((item) => item.id === props.session.model) ? null : (
                <option value={props.session.model}>{props.session.model}</option>
              )}
              {models.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <p className="a008-parameter-footnote">Changing model starts a new conversation.</p>
          {connected ? (
            <ModelParameterForm
              key={`${props.session.sessionId ?? "idle"}/${model.id}`}
              session={props.session}
              model={model}
              initial={props.session.details?.parameters ?? model.defaults}
            />
          ) : (
            <p className="a008-parameter-footnote">Connect to inspect and change the active session.</p>
          )}
          <section aria-label="Session">
            <h3>Session</h3>
            <p className="a008-parameter-footnote">
              {props.session.projectId ? `Project ${props.session.projectId}` : "Not connected."}
            </p>
            <div className="a008-global-actions">
              <button type="button" disabled={!connected} onClick={() => void reset()}>
                Reset
              </button>
              <button type="button" disabled={!connected} onClick={() => void undo()}>
                Undo
              </button>
              <button
                type="button"
                disabled={!connected}
                onClick={() => void props.session.disconnect()}
              >
                End session
              </button>
            </div>
          </section>
        </div>

        <div hidden={page !== "semantic"}>
          {connected ? (
            <GlobalSettingsForm
              session={props.session}
              initial={props.session.details?.runtimePreferences ?? emptyRuntimePreferences(props.session.model)}
              page="semantic"
              models={models}
            />
          ) : (
            <p className="a008-parameter-footnote">Connect to inspect and change global semantic settings.</p>
          )}
        </div>

        <div hidden={page !== "provider"}>
          <NvidiaCatalogPanel />
        </div>

        <div hidden={page !== "mcp"}>
          <McpServersPanel />
        </div>

        <div hidden={page !== "runtime"}>
          <RuntimeCapabilitiesPanel />
        </div>

        <div hidden={page !== "budgets"}>
          {connected ? (
            <GlobalSettingsForm
              session={props.session}
              initial={props.session.details?.runtimePreferences ?? emptyRuntimePreferences(props.session.model)}
              page="budgets"
              models={models}
            />
          ) : (
            <p className="a008-parameter-footnote">Connect to inspect and change global budgets.</p>
          )}
        </div>

        <div hidden={page !== "instructions"}>
          {connected ? (
            <GlobalSettingsForm
              session={props.session}
              initial={props.session.details?.runtimePreferences ?? emptyRuntimePreferences(props.session.model)}
              page="instructions"
              models={models}
            />
          ) : (
            <p className="a008-parameter-footnote">Connect to inspect and change persistent instructions.</p>
          )}
        </div>

        <div hidden={page !== "radar"}>
          <ZeroCostRadarPanel />
        </div>

        <div hidden={page !== "skills"}>
          <SkillsPanel />
        </div>

        <div hidden={page !== "appearance"}>
          <section className="a008-appearance" aria-label="Appearance">
            <h3>App theme</h3>
            <p className="a008-parameter-footnote">
              Changes this client only. It does not change the model or memory.
            </p>
            <div className="a008-theme-choices" role="group" aria-label="App theme">
              {APP_THEMES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="a008-theme-card"
                  data-a008-theme={item.id}
                  aria-pressed={theme === item.id}
                  onClick={() => setTheme(selectAppTheme(item.id))}
                >
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {error ? (
          <p className="a008-parameter-error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? <p className="a008-parameter-notice">{notice}</p> : null}
      </div>
    </dialog>
  );
}
