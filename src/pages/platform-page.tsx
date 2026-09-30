import { useEffect, useRef, useState } from "react";
import { cancelRun, createConversation, createRun, listConversations, loadConversation, loadPlatform, loadRun, platformMessageText, type PlatformConversation, type PlatformProject, type PlatformRun } from "../platform/platform-client.js";
import "./client.css";

type Attempt = { readonly conversation: PlatformConversation; readonly text: string; readonly model: string; readonly commandId: string };
export function PlatformPage(props: { readonly active: boolean; readonly model: string; readonly requestedProjectId?: string; readonly requestedConversationId?: string; readonly requestNewChat?: number }) {
  const [available, setAvailable] = useState<boolean>();
  const [projects, setProjects] = useState<readonly PlatformProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [conversations, setConversations] = useState<readonly PlatformConversation[]>([]);
  const [conversation, setConversation] = useState<PlatformConversation>();
  const [run, setRun] = useState<PlatformRun>();
  const [attempt, setAttempt] = useState<Attempt>();
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const restoreAttempt = useRef(false);
  const requestHandled = useRef(0);

  useEffect(() => {
    if (!props.active) return;
    let live = true;
    setProjectId(""); setConversation(undefined); setConversations([]); setRun(undefined);
    setLoading(true); setMessage("");
    void loadPlatform().then((result) => {
      if (!live) return;
      setAvailable(result.available); setProjects(result.projects);
      if (!result.available || result.projects.length === 0) { setLoading(false); return; }
      const initialProject = result.projects.find((project) => project.projectId === props.requestedProjectId)?.projectId ?? result.projects[0]!.projectId;
      void selectProject(initialProject);
    }).catch((error: unknown) => {
      if (live) { setAvailable(false); setMessage(error instanceof Error ? error.message : "Platform discovery failed."); setLoading(false); }
    });
    return () => { live = false; };
  }, [props.active]);

  useEffect(() => {
    if (!props.active || available !== true || run || attempt) return;
    if (props.requestNewChat && requestHandled.current !== props.requestNewChat) {
      requestHandled.current = props.requestNewChat;
      const projectId = props.requestedProjectId ?? projects[0]?.projectId;
      setTitle("New chat");
      if (projectId) { setProjectId(projectId); setConversations([]); setConversation(undefined); setRun(undefined); void listConversations(projectId).then(setConversations); }
      return;
    }
    if (props.requestedConversationId) void selectConversation(props.requestedConversationId);
  }, [props.requestNewChat, props.requestedProjectId, props.requestedConversationId, props.active, available, run, attempt]);

  async function selectProject(nextId: string): Promise<void> {
    setProjectId(nextId); setConversation(undefined); setRun(undefined); setAttempt(undefined); setConversations([]);
    if (!nextId) { setLoading(false); return; }
    setLoading(true); setMessage("");
    try {
      const result = await listConversations(nextId);
      setConversations(result);
      if (result.length > 0) await selectConversation(result[0]!.id);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load conversations."); }
    finally { setLoading(false); }
  }
  async function selectConversation(id: string): Promise<void> {
    setLoading(true); setMessage("");
    try {
      const next = await loadConversation(id); setConversation(next); setAttempt(undefined);
      const lastRunId = [...next.messages].reverse().find((item) => item.runId)?.runId;
      if (lastRunId) setRun(await loadRun(lastRunId)); else setRun(undefined);
      if (restoreAttempt.current) { restoreAttempt.current = false; return; }
      if (lastRunId) return;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not open conversation."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    if (!props.active || !conversation || !run || (run.status !== "queued" && run.status !== "running")) return;
    const conversationId = conversation.id;
    const runId = run.id;
    let live = true;
    const timer = window.setInterval(() => {
      void Promise.all([loadRun(runId), loadConversation(conversationId)]).then(([nextRun, nextConversation]) => {
        if (live) { setRun(nextRun); setConversation(nextConversation); }
      }).catch((error: unknown) => { if (live) setMessage(error instanceof Error ? error.message : "Run status refresh failed."); });
    }, 1000);
    return () => { live = false; window.clearInterval(timer); };
  }, [props.active, conversation?.id, run?.id, run?.status]);

  async function createNewConversation(): Promise<void> {
    if (!projectId || !title.trim()) return;
    setBusy(true); setMessage("");
    try {
      const created = await createConversation(projectId, title.trim(), props.model);
      setTitle("");
      const refreshed = await listConversations(projectId); setConversations(refreshed);
      await selectConversation(created.id);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create conversation."); }
    finally { setBusy(false); }
  }
  async function submitRun(retry = false): Promise<void> {
    const existing = retry ? attempt : undefined;
    const current = existing?.conversation ?? conversation;
    const text = existing?.text ?? draft.trim();
    const model = existing?.model ?? props.model;
    if (!current || !text || !model.trim() || busy) return;
    const next: Attempt = existing ?? { conversation: current, text, model, commandId: globalThis.crypto.randomUUID() as string };
    setAttempt(next); setBusy(true); setMessage("");
    try {
      const accepted = await createRun(next.conversation, next.text, next.model, next.commandId);
      setRun(accepted.run); setAttempt(undefined); setDraft("");
      setConversation(await loadConversation(next.conversation.id));
      setRun(await loadRun(accepted.run.id));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not start run."); }
    finally { setBusy(false); }
  }
  async function cancelCurrentRun(): Promise<void> {
    if (!run || busy) return;
    setBusy(true);
    try { setRun(await cancelRun(run.id, run.revision)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not cancel run."); }
    finally { setBusy(false); }
  }
  return <section className="a008-platform" aria-label="Platform"><header><p>PLATFORM V3</p><h1>Platform</h1></header>
    {loading ? <p role="status">Loading Platform workspace.</p> : null}
    {available === false ? <p className="a008-note">{message || "Platform V3 is unavailable. No run was started."}</p> : null}
    {available ? <div className="a008-platform-grid">
      <label>Project<select aria-label="Platform project" value={projectId} onChange={(event) => void selectProject(event.currentTarget.value)}><option value="">Select a project</option>{projects.map((project) => <option key={project.projectId} value={project.projectId}>{project.name}</option>)}</select></label>
      {projectId ? <><h2>Conversations</h2><ul className="a008-project-list">{conversations.map((item) => <li key={item.id}><button type="button" aria-pressed={conversation?.id === item.id} onClick={() => void selectConversation(item.id)}>{item.title}<span>{item.workspaceId}</span></button></li>)}</ul>
        <label>Conversation title<input aria-label="Conversation title" value={title} onChange={(event) => setTitle(event.currentTarget.value)} /></label><button type="button" disabled={busy || !title.trim()} onClick={() => void createNewConversation()}>Create conversation</button></> : null}
      {conversation ? <><h2>{conversation.title}</h2><ol className="a008-project-list" aria-label="Conversation transcript">{conversation.messages.map((item, index) => <li key={`${index}/${item.role}`}><strong>{item.role}</strong><p>{platformMessageText(item.content)}</p></li>)}</ol>
        <label>Text run<textarea aria-label="Platform prompt" value={draft} onChange={(event) => setDraft(event.currentTarget.value)} /></label><button type="button" disabled={busy || !draft.trim() || !props.model.trim()} onClick={() => void submitRun()}>Start text run</button>
        {run ? <div role="status"><strong>Run {run.id}: {run.status}</strong>{run.error?.message ? <p>{run.error.message}</p> : null}{run.status === "queued" || run.status === "running" ? <button type="button" disabled={busy} onClick={() => void cancelCurrentRun()}>Cancel run</button> : null}<button type="button" disabled={busy} onClick={() => void selectConversation(conversation.id)}>Refresh run status</button></div> : null}
        {attempt ? <button type="button" disabled={busy} onClick={() => void submitRun(true)}>Retry same command safely</button> : null}</> : null}
      {message && available ? <p className="a008-note" role="alert">{message}</p> : null}
    </div> : null}
  </section>;
}
