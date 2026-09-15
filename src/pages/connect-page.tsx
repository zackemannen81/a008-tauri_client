import { useEffect, useState, type FormEvent } from "react";
import { persistConnection } from "../host/storage.js";
import {
  loginWithPin,
  resolveHostEndpoints,
  tryListModels,
  tryListProjects,
  type ListedModel,
  type ListedProject,
} from "../host/v2-http.js";
import { DEFAULT_MODEL } from "../host/v2-types.js";
import "./client.css";

export function ConnectPage(props: {
  readonly host: string;
  readonly projectId: string;
  readonly model: string;
  readonly error?: string;
  readonly busy: boolean;
  readonly onSubmit: (next: {
    host: string;
    projectId: string;
    credential: string;
    model: string;
    projectName?: string;
  }) => void;
}) {
  const host = props.host;
  const [pin, setPin] = useState("");
  const [projectId, setProjectId] = useState(props.projectId);
  const [model, setModel] = useState(props.model || DEFAULT_MODEL);
  const [projects, setProjects] = useState<readonly ListedProject[]>([]);
  const [models, setModels] = useState<readonly ListedModel[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localError, setLocalError] = useState("");

  async function loadInventory(): Promise<boolean> {
    const listing = await tryListProjects(resolveHostEndpoints(host).httpBase);
    if (listing === undefined) {
      setUnlocked(false);
      setProjects([]);
      return false;
    }
    setUnlocked(true);
    setProjects(listing.projects);
    const preferred =
      (projectId && listing.projects.some((item) => item.projectId === projectId) && projectId) ||
      listing.currentId ||
      listing.projects[0]?.projectId ||
      "";
    if (preferred) setProjectId(preferred);
    const listedModels = await tryListModels(resolveHostEndpoints(host).httpBase);
    if (listedModels) setModels(listedModels);
    return true;
  }

  useEffect(() => {
    let cancelled = false;
    void loadInventory()
      .catch(() => false)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function unlock(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLocalError("");
    try {
      await loginWithPin(resolveHostEndpoints(host).httpBase, pin);
      setPin("");
      const ok = await loadInventory();
      if (!ok) setLocalError("PIN accepted, but the project list could not be read.");
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "PIN login failed.");
    }
  }

  const selected = projects.find((item) => item.projectId === projectId);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setLocalError("");
    if (!projectId) {
      setLocalError("Select a project.");
      return;
    }
    const next = {
      host: host.trim(),
      projectId,
      credential: "",
      model: model.trim() || DEFAULT_MODEL,
      ...(selected ? { projectName: selected.name } : {}),
    };
    persistConnection(next);
    props.onSubmit(next);
  }

  return (
    <section className="a008-connect" aria-label="Connect">
      <header>
        <p>Owner login</p>
        <h1>Connect to A008</h1>
      </header>
      <p className="a008-note">
        Use the same six-digit PIN as the A008 GUI. That cookie is the owner
        profile. A device credential from <code>npm run device -- grant</code> is
        only for separate native clients, not this desktop session.
      </p>

      {loading ? <p className="a008-note">Looking for a host session…</p> : null}

      {!loading && !unlocked ? (
        <form className="a008-connect-form" onSubmit={(event) => void unlock(event)}>
          <label>
            PIN
            <input
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/gu, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="••••••"
              required
            />
          </label>
          <button type="submit">Unlock</button>
        </form>
      ) : null}

      {unlocked ? (
        <form className="a008-connect-form" onSubmit={submit}>
          <fieldset className="a008-project-picker">
            <legend>Project</legend>
            {projects.length === 0 ? (
              <p className="a008-note">The host registry has no projects yet. Create one in the A008 GUI.</p>
            ) : (
              <ul className="a008-project-list a008-project-list-scroll" role="listbox" aria-label="Registered projects">
                {projects.map((project) => (
                  <li key={project.projectId}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={project.projectId === projectId}
                      onClick={() => setProjectId(project.projectId)}
                    >
                      {project.name}
                      {project.rootFolder ? <span>{project.rootFolder}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
          {selected ? (
            <p className="a008-note">
              Opens a V2 chat session in <strong>{selected.name}</strong>
              {selected.rootFolder ? ` (${selected.rootFolder})` : ""}.
            </p>
          ) : null}
          {models.length > 0 ? (
            <label>
              Model
              <select value={model} onChange={(event) => setModel(event.target.value)}>
                {models.some((item) => item.id === model) ? null : <option value={model}>{model}</option>}
                {models.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Model
              <input value={model} onChange={(event) => setModel(event.target.value)} autoComplete="off" />
            </label>
          )}
          {localError || props.error ? (
            <p className="a008-composer-error" role="alert">
              {localError || props.error}
            </p>
          ) : null}
          <button type="submit" disabled={props.busy || !projectId}>
            {props.busy ? "Connecting…" : "Open session"}
          </button>
        </form>
      ) : null}

      {!unlocked && (localError || props.error) ? (
        <p className="a008-composer-error" role="alert">
          {localError || props.error}
        </p>
      ) : null}
    </section>
  );
}
