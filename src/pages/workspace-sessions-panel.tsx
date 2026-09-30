import { useEffect, useState } from "react";
import { hostFetch } from "../host/tauri-http.js";
import { createWorkspaceSession, listWorkspaceSessions, updateWorkspaceSession, type WorkspaceSession } from "../platform/platform-client.js";

export function WorkspaceSessionsPanel(props: { readonly projectId: string; readonly onOpened?: (session: WorkspaceSession) => void }) {
  const [sessions, setSessions] = useState<readonly WorkspaceSession[]>([]);
  const [branch, setBranch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function refresh(): Promise<void> { if (props.projectId) setSessions(await listWorkspaceSessions(props.projectId)); }
  useEffect(() => {
    let live = true;
    void refresh().catch((reason) => { if (live) setError(reason instanceof Error ? reason.message : "Could not list parallel sessions."); });
    return () => { live = false; };
  }, [props.projectId]);
  async function create(): Promise<void> {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await hostFetch(`/v1/projects/${encodeURIComponent(props.projectId)}/workspaces`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(branch.trim() ? { baseBranch: branch.trim() } : {}) });
      const body = await response.json() as { session?: WorkspaceSession; error?: string };
      if (!response.ok || !body.session) throw new Error(body.error ?? "Could not create workspace session.");
      setBranch(""); setNotice(`Created ${body.session.branchName ?? body.session.id}.`); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create workspace session."); }
    finally { setBusy(false); }
  }
  async function open(session: WorkspaceSession): Promise<void> {
    setBusy(true); setError("");
    try {
      const response = await hostFetch(`/v1/projects/${encodeURIComponent(props.projectId)}/workspaces/${encodeURIComponent(session.id)}/open`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      let body: unknown; try { body = await response.json(); } catch { body = undefined; }
      if (!response.ok) throw new Error(body && typeof body === "object" && "message" in body && typeof body.message === "string" ? body.message : "Could not open workspace session.");
      setNotice("Workspace session opened. Reconnect the chat to bind the active V2 client to it."); props.onOpened?.(session);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not open workspace session."); }
    finally { setBusy(false); await refresh().catch(() => undefined); }
  }
  async function change(session: WorkspaceSession, action: "keep" | "discard"): Promise<void> {
    if (action === "discard" && (!session.status.clean || session.status.commitsAhead > 0)) { setError("Discard requires a clean worktree with no commits ahead."); return; }
    if (action === "discard" && !window.confirm("Discard this clean worktree? This cannot be undone.")) return;
    setBusy(true); setError("");
    try { await updateWorkspaceSession(props.projectId, session.id, action); setNotice(action === "keep" ? "Workspace session kept." : "Workspace session discarded."); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : `Could not ${action} workspace session.`); }
    finally { setBusy(false); }
  }
  return <section className="a008-workspace-sessions" aria-label="Parallel workspace sessions"><h3>Project workspaces</h3><label>Base branch (optional)<input value={branch} onChange={(event) => setBranch(event.currentTarget.value)} /></label><button type="button" disabled={busy || !props.projectId} onClick={() => void create()}>New parallel session</button><ul>{sessions.map((session) => <li key={session.id}><strong>{session.branchName ?? session.id}</strong><p>{session.workspacePath}</p><p>{session.status.modifiedFiles} modified · {session.status.commitsAhead} commits ahead · {session.disposition}</p>{session.disposition === "active" ? <><button type="button" disabled={busy} onClick={() => void open(session)}>Open</button><button type="button" disabled={busy} onClick={() => void change(session, "keep")}>Keep</button><button type="button" disabled={busy || !session.status.clean || session.status.commitsAhead > 0} onClick={() => void change(session, "discard")}>Discard</button></> : null}</li>)}</ul>{notice ? <p role="status">{notice}</p> : null}{error ? <p role="alert">{error}</p> : null}</section>;
}
