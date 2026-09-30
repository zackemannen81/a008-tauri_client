import { useEffect, useState } from "react";
import { hostFetch } from "../host/tauri-http.js";
import { listConversations, type PlatformConversation } from "../platform/platform-client.js";
import { WorkspaceSessionsPanel } from "./workspace-sessions-panel.js";
import "./client.css";
interface Project { readonly projectId: string; readonly name: string; readonly rootFolder: string; readonly pinned?: boolean; }
interface ChatRow { readonly id: string; readonly title: string; }
async function updateProject(projectId: string, update: { name?: string; pinned?: boolean }): Promise<void> {
  const response = await hostFetch("/v1/projects/update", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId, ...update }) });
  if (!response.ok) { let body: unknown; try { body = await response.json(); } catch { body = undefined; } throw new Error(body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "Project update failed."); }
}
export function ProjectSidebar(props: {
  readonly active: boolean;
  readonly selectedProjectId: string;
  readonly selectedConversationId: string;
  readonly onSelectProject: (projectId: string) => void;
  readonly onSelectConversation: (projectId: string, conversationId: string) => void;
  readonly onNewChat: (projectId: string) => void;
  readonly onNewProject: () => void;
}) {
  const [projects, setProjects] = useState<readonly Project[]>([]);
  const [chats, setChats] = useState<Readonly<Record<string, readonly ChatRow[]>>>({});
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [details, setDetails] = useState("");
  const [workspaceProject, setWorkspaceProject] = useState<Project>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function refresh(): Promise<void> {
    const response = await hostFetch("/v1/projects/sidebar");
    if (!response.ok) throw new Error("Project sidebar is unavailable until owner PIN access is connected.");
    const body = await response.json() as { projects?: readonly Project[] };
    const next = Array.isArray(body.projects) ? body.projects : [];
    setProjects(next);
    setChats(Object.fromEntries(await Promise.all(next.map(async (project) => {
      try {
        const result = await listConversations(project.projectId);
        return [project.projectId, result.map((chat: PlatformConversation) => ({ id: chat.id, title: chat.title }))] as const;
      } catch { return [project.projectId, []] as const; }
    }))));
  }
  useEffect(() => {
    if (!props.active) return;
    let live = true;
    const load = () => { void refresh().catch((reason) => { if (live) setError(reason instanceof Error ? reason.message : "Could not load project sidebar."); }); };
    load(); window.addEventListener("focus", load);
    const timer = window.setInterval(load, 10000);
    return () => { live = false; window.removeEventListener("focus", load); window.clearInterval(timer); };
  }, [props.active]);
  async function update(project: Project, value: { name?: string; pinned?: boolean }): Promise<void> {
    setBusy(true); setError(""); setDetails("");
    try { await updateProject(project.projectId, value); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Project update failed."); }
    finally { setBusy(false); }
  }
  const sorted = [...projects].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || a.name.localeCompare(b.name, undefined, { numeric: true }));
  return <section className="a008-project-sidebar" aria-label="Project chats">
    <header><strong>Projects</strong><button type="button" aria-label="New project" onClick={props.onNewProject}>+</button></header>
    <ul>{sorted.map((project) => <li key={project.projectId}>
      <div className="a008-project-sidebar-row">
        <button type="button" aria-expanded={expanded.has(project.projectId)} aria-label={`${expanded.has(project.projectId) ? "Collapse" : "Expand"} ${project.name}`} onClick={() => setExpanded((previous) => { const next = new Set(previous); if (next.has(project.projectId)) next.delete(project.projectId); else next.add(project.projectId); return next; })}>{expanded.has(project.projectId) ? "▾" : "▸"}</button>
        <button type="button" aria-current={props.selectedProjectId === project.projectId ? "page" : undefined} title={project.rootFolder} onClick={() => props.onSelectProject(project.projectId)}>{project.name}</button>
        <button type="button" aria-label={`Project details: ${project.name}`} onClick={() => setDetails(details === project.projectId ? "" : project.projectId)}>⋯</button>
        <button type="button" aria-label={`New chat in ${project.name}`} onClick={() => props.onNewChat(project.projectId)}>✎</button>
      </div>
      {details === project.projectId ? <div role="menu" className="a008-project-context" aria-label={`${project.name} actions`}><button type="button" role="menuitem" onClick={() => void update(project, { pinned: !project.pinned })}>{project.pinned ? "Unpin project" : "Pin project"}</button><button type="button" role="menuitem" onClick={() => { const name = window.prompt("Project name", project.name)?.trim(); if (name && name !== project.name) void update(project, { name }); }}>Rename project</button><button type="button" role="menuitem" onClick={() => setWorkspaceProject(project)}>Workspace sessions</button></div> : null}
      {details === project.projectId ? <div role="menu" className="a008-project-context" aria-label={`${project.name} actions`}><button type="button" role="menuitem" onClick={() => void update(project, { pinned: !project.pinned })}>{project.pinned ? "Unpin project" : "Pin project"}</button><button type="button" role="menuitem" onClick={() => { const name = window.prompt("Project name", project.name)?.trim(); if (name && name !== project.name) void update(project, { name }); }}>Rename project</button><button type="button" role="menuitem" onClick={() => setWorkspaceProject(project)}>Workspace sessions</button></div> : null}
      {expanded.has(project.projectId) ? <><ul><li><button type="button" onClick={() => props.onNewChat(project.projectId)}>New chat</button></li>{(chats[project.projectId] ?? []).map((chat) => <li key={chat.id}><button type="button" aria-current={props.selectedConversationId === chat.id ? "page" : undefined} onClick={() => props.onSelectConversation(project.projectId, chat.id)}>{chat.title}</button></li>)}</ul></> : null}
    </li>)}</ul>
    {details ? <dialog open aria-label="Project context menu" onClick={() => setDetails("")}><button type="button" onClick={() => { const project = projects.find((item) => item.projectId === details); if (project) { const name = window.prompt("Project name", project.name)?.trim(); if (name && name !== project.name) void update(project, { name }); } }}>Rename project</button><button type="button" onClick={() => { const project = projects.find((item) => item.projectId === details); if (project) void update(project, { pinned: !project.pinned }); }}>Toggle pin</button><button type="button" onClick={() => setDetails("")}>Close</button></dialog> : null}
    {workspaceProject ? <dialog open aria-label="Workspace sessions"><WorkspaceSessionsPanel projectId={workspaceProject.projectId} /><button type="button" onClick={() => setWorkspaceProject(undefined)}>Close</button></dialog> : null}
    {error ? <p role="status">{error}</p> : null}
  </section>;
}
