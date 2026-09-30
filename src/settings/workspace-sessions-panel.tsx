import { useEffect, useState } from "react";
import { getWorkspaceRoot, saveWorkspaceRoot } from "../platform/platform-client.js";

export function WorkspaceSessionsPanel() {
  const [workspaceRoot, setWorkspaceRoot] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let live = true;
    void getWorkspaceRoot().then((root) => { if (live) setWorkspaceRoot(root); }).catch((reason) => {
      if (live) setError(reason instanceof Error ? reason.message : "Could not load parallel-session settings.");
    }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);
  async function save(): Promise<void> {
    if (!workspaceRoot.trim()) { setError("Workspace root is required."); return; }
    setBusy(true); setError(""); setNotice("");
    try { await saveWorkspaceRoot(workspaceRoot.trim()); setNotice("Workspace root saved."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save workspace root."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Parallel workspace sessions"><h3>Parallel sessions</h3><p>Configure the host workspace root used for isolated project worktrees.</p><label>Workspace root<input aria-label="Workspace root" value={workspaceRoot} onChange={(event) => setWorkspaceRoot(event.currentTarget.value)} /></label><button type="button" disabled={loading || busy || !workspaceRoot.trim()} onClick={() => void save()}>Save workspace root</button>{notice ? <p role="status">{notice}</p> : null}{error ? <p role="alert">{error}</p> : null}</section>;
}
