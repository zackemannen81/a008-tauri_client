import { useEffect, useRef, useState } from "react";
import { APP_THEMES, type AppThemeId } from "../brand/theme.js";
import { readStoredAppTheme, selectAppTheme } from "../brand/theme-storage.js";
import { tryListModels, type ListedModel } from "../host/v2-http.js";
import type { ClientSession } from "../session/types.js";
import "./parameters.css";

export function ParametersPanel(props: {
  readonly open: boolean;
  readonly session: ClientSession;
  readonly httpBase: string;
  readonly onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [theme, setTheme] = useState<AppThemeId>(() => readStoredAppTheme());
  const [models, setModels] = useState<readonly ListedModel[]>([]);
  const [notice, setNotice] = useState("");
  const connected = props.session.status === "ready";

  useEffect(() => {
    if (props.open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [props.open]);

  useEffect(() => {
    if (!props.open) return;
    void tryListModels(props.httpBase).then((listed) => {
      if (listed) setModels(listed);
    });
  }, [props.open, props.httpBase]);

  async function reset(): Promise<void> {
    setNotice("");
    try {
      await props.session.controlSession({ action: "reset" });
      setNotice("Conversation cleared.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Reset failed.");
    }
  }

  async function undo(): Promise<void> {
    setNotice("");
    try {
      const state = await props.session.controlSession({ action: "undo" });
      setNotice(state.undone ? "Last turn undone." : "Nothing to undo.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Undo failed.");
    }
  }

  async function changeModel(model: string): Promise<void> {
    if (!model || model === props.session.model) return;
    setNotice("");
    try {
      await props.session.controlSession({ action: "model", model });
      setNotice(`Model: ${model}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Model change failed.");
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
          <p>Client 0.1</p>
          <h2>Parameters</h2>
        </div>
        <button type="button" aria-label="Close parameters" onClick={props.onClose}>
          ×
        </button>
      </header>
      <div className="a008-parameters-body">
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
        <section aria-label="Session">
          <h3>Session</h3>
          <p className="a008-parameter-footnote">
            {props.session.projectId
              ? `Project ${props.session.projectId}`
              : "Not connected."}
          </p>
          <label>
            Model
            <select
              value={props.session.model}
              disabled={!connected}
              onChange={(event) => void changeModel(event.target.value)}
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
          <div className="a008-global-actions">
            <button type="button" disabled={!connected} onClick={() => void reset()}>
              Reset
            </button>
            <button type="button" disabled={!connected} onClick={() => void undo()}>
              Undo
            </button>
            <button type="button" disabled={!connected} onClick={() => void props.session.disconnect()}>
              End session
            </button>
          </div>
          {notice ? <p className="a008-parameter-notice">{notice}</p> : null}
        </section>
      </div>
    </dialog>
  );
}
