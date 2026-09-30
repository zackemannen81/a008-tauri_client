import { useEffect, useMemo, useRef, useState } from "react";
import {
  CodeArtifactPanel,
  type CodeArtifactView,
} from "./artifact/code-artifact-panel.js";
import type { HtmlArtifactCandidate } from "./artifact/code-artifact.js";
import { APP_THEMES, type AppThemeId } from "./brand/theme.js";
import { readStoredAppTheme, selectAppTheme } from "./brand/theme-storage.js";
import { ChatPane } from "./chat/chat-pane.js";
import { Composer } from "./chat/composer.js";
import {
  persistShortcutDockVisible,
  ShortcutDock,
  shortcutDockVisible,
  type EmptyShortcutId,
} from "./chat/empty-shortcuts.js";
import { ProjectSidebar } from "./pages/project-sidebar.js";
import type { ReactNode } from "react";
import { FilesPane, LIST_FILES_PROMPT, readFilePrompt } from "./files/files-pane.js";
import { resolveHostEndpoints } from "./host/v2-http.js";
import { persistConnection, readStoredConnection } from "./host/storage.js";
import { ConnectPage } from "./pages/connect-page.js";
import { HelpPage } from "./pages/help-page.js";
import { MemoryPage } from "./pages/memory-page.js";
import { ProjectsPage } from "./pages/projects-page.js";
import { PlatformPage } from "./pages/platform-page.js";
import { ToolsPage, type ToolSurface } from "./pages/tools-page.js";
import { ParametersPanel } from "./settings/parameters-panel.js";
import { SettingsPane } from "./settings/settings-pane.js";
import { ToolPermissionDialog } from "./session/tool-permission-dialog.js";
import { useV2Session } from "./session/use-v2-session.js";
import { EnvironmentPanel } from "./workbench/environment-panel.js";
import { persistSidebarHidden, persistSidebarWidth, readSidebarHidden, readSidebarWidth } from "./brand/sidebar-state.js";
import { SkillsPanel, type InstalledSkill } from "./settings/skills-panel.js";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

const STATUS_LABEL = {
  idle: "Not connected",
  connecting: "Connecting",
  ready: "Connected",
  error: "Runtime error",
} as const;

const REVIEW_PROMPT =
  "Granska ?ndringarna i arbetskopian med git status, git diff och git diff --cached. L?s ber?rda filer vid behov och sammanfatta fynden.";

type Page = "chat" | "memory" | "tools" | "help" | "projects" | "platform";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

export function App() {
  const session = useV2Session();
  const [selectedSkill, setSelectedSkill] = useState<InstalledSkill>();
  const stored = readStoredConnection();
  const [page, setPage] = useState<Page>("chat");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(() => readSidebarHidden());
  const [sidebarWidth, setSidebarWidth] = useState(() => readSidebarWidth());
  const [projectSidebarOpen, setProjectSidebarOpen] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [newChatRequest, setNewChatRequest] = useState(0);
  const [menu, setMenu] = useState("");
  const [parametersOpen, setParametersOpen] = useState(false);
  const [host, setHost] = useState(stored?.host ?? "");
  const [projectId, setProjectId] = useState(stored?.projectId ?? "");
  const [model, setModel] = useState(stored?.model ?? session.model);
  const [projectName, setProjectName] = useState(stored?.projectName ?? "");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(() => shortcutDockVisible());
  const [toolSurface, setToolSurface] = useState<ToolSurface>("terminal");
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [artifact, setArtifact] = useState<CodeArtifactView>();
  const [pendingArtifact, setPendingArtifact] = useState<HtmlArtifactCandidate>();
  const artifactSessionId = useRef<string | undefined>(session.sessionId);
  const endpoints = useMemo(() => resolveHostEndpoints(host), [host]);
  const workspace = projectName || session.projectId || projectId;
  const panelOpen = toolsOpen || filesOpen || canvasOpen;

  function resizeSidebar(width: number) {
    const next = Math.max(208, Math.min(480, Math.round(width)));
    setSidebarWidth(next); persistSidebarWidth(next);
  }
  function beginSidebarResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX; const startWidth = sidebarWidth;
    function move(pointer: PointerEvent) { resizeSidebar(startWidth + pointer.clientX - startX); }
    function end() { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); }
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", end, { once: true });
  }

  useEffect(() => {
    if (artifactSessionId.current === session.sessionId) return;
    artifactSessionId.current = session.sessionId;
    setArtifact(undefined);
    setPendingArtifact(undefined);
    setCanvasOpen(false);
  }, [session.sessionId]);

  const committedMessageCount = session.details?.messages.length;
  useEffect(() => {
    if (committedMessageCount !== 0) return;
    setArtifact(undefined);
    setPendingArtifact(undefined);
  }, [committedMessageCount]);

  function navigate(next: Page) {
    setPage(next);
    setNavigationOpen(false);
    if (next === "chat") setToolsOpen(false);
    else setCanvasOpen(false);
  }

  function openTools(surface: ToolSurface) {
    setToolSurface(surface);
    setPage("tools");
    setToolsOpen(false);
    setCanvasOpen(false);
    setNavigationOpen(false);
  }

  function connect(next: {
    host: string;
    projectId: string;
    credential: string;
    model: string;
    projectName?: string;
  }) {
    setHost(next.host);
    setProjectId(next.projectId);
    setModel(next.model);
    if (next.projectName) setProjectName(next.projectName);
    session.configure(next);
    void session.connect();
    navigate("chat");
  }

  async function ask(prompt: string) {
    navigate("chat");
    try {
      await session.prompt(prompt);
    } catch {
      /* ChatPane renders session.error */
    }
  }

  function modelArtifact(next: HtmlArtifactCandidate): CodeArtifactView {
    return {
      sourceTurnId: next.sourceTurnId,
      source: next.source,
      modelSource: next.source,
      dirty: false,
    };
  }

  function openArtifact(next: HtmlArtifactCandidate) {
    setArtifact(modelArtifact(next));
    setPendingArtifact(undefined);
    setCanvasOpen(true);
    setFilesOpen(false);
    setToolsOpen(false);
  }

  function considerArtifact(next: HtmlArtifactCandidate) {
    if (!artifact) {
      if (canvasOpen) setArtifact(modelArtifact(next));
      return;
    }
    if (next.sourceTurnId === artifact.sourceTurnId && next.source === artifact.modelSource) return;
    if (artifact.dirty) {
      setPendingArtifact(next);
      return;
    }
    setArtifact(modelArtifact(next));
    setPendingArtifact(undefined);
  }

  function onShortcut(id: EmptyShortcutId) {
    if (id === "review") void ask(REVIEW_PROMPT);
    if (id === "terminal") openTools("terminal");
    if (id === "browser") openTools("browser");
    if (id === "files") {
      setPage("chat");
      setCanvasOpen(false);
      setFilesOpen((open) => !open);
    }
    if (id === "sidechat") {
      setPage("chat");
      setCanvasOpen(false);
      setToolsOpen((open) => !open);
    }
  }
  const shortcutRef = useRef(onShortcut);
  shortcutRef.current = onShortcut;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.isComposing) return;
      const ctrl = event.ctrlKey || event.metaKey;
      if (!ctrl) return;
      const key = event.key.toLowerCase();
      if (event.shiftKey && key === "g") {
        event.preventDefault();
        shortcutRef.current("review");
        return;
      }
      if (event.altKey && key === "s") {
        event.preventDefault();
        shortcutRef.current("sidechat");
        return;
      }
      if (isTypingTarget(event.target) && !event.altKey && !event.shiftKey) {
        if (key !== "`") return;
      }
      if (key === "`" && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        shortcutRef.current("terminal");
      } else if (key === "t" && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        shortcutRef.current("browser");
      } else if (key === "p" && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        shortcutRef.current("files");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className={`a008-app a008-${page}-workspace${panelOpen ? " a008-panel-open" : ""}${navigationOpen ? " a008-navigation-open" : ""}${sidebarHidden ? " a008-sidebar-hidden" : ""}`}
      style={{ "--a008-sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <div className="a008-crt-overlay" aria-hidden="true" />
      <ToolPermissionDialog session={session} />
      <ParametersPanel
        open={parametersOpen}
        session={session}
        httpBase={endpoints.httpBase}
        onClose={() => setParametersOpen(false)}
      />
      <aside className="a008-rail" id="a008-navigation" aria-label="Workspace navigation">
        <div className="a008-sidebar-brand">
          <BrandMark />
        </div>
        <nav className="a008-sidebar-nav" aria-label="Workspace" hidden={sidebarHidden}>
          <button type="button" aria-current={page === "chat" ? "page" : undefined} onClick={() => navigate("chat")}>
            <span aria-hidden="true">?</span> Chat
          </button>
          <button
            type="button"
            aria-current={page === "memory" ? "page" : undefined}
            onClick={() => navigate("memory")}
          >
            <span aria-hidden="true">?</span> Memory
          </button>
          <button
            type="button"
            aria-current={page === "tools" ? "page" : undefined}
            onClick={() => navigate("tools")}
          >
            <span aria-hidden="true">?</span> Tools
          </button>
          <button type="button" aria-current={page === "help" ? "page" : undefined} onClick={() => navigate("help")}>
            <span aria-hidden="true">?</span> Help
          </button>
          <button
            type="button"
            aria-current={page === "projects" ? "page" : undefined}
            onClick={() => navigate("projects")}
          >
            <span aria-hidden="true">?</span> Projects
          </button>
          <button type="button" aria-current={page === "platform" ? "page" : undefined} onClick={() => navigate("platform")}><span aria-hidden="true">â—«</span> Platform</button>
        </nav>
        {session.projectId ? <ProjectSidebar active={!sidebarHidden && projectSidebarOpen} selectedProjectId={session.projectId} selectedConversationId={selectedConversationId} onSelectProject={(id) => { setProjectId(id); setSelectedConversationId(""); setPage("platform"); }} onSelectConversation={(project, chat) => { setProjectId(project); setSelectedConversationId(chat); setPage("platform"); }} onNewChat={(id) => { setProjectId(id); setSelectedConversationId(""); setNewChatRequest((value) => value + 1); setPage("platform"); }} onNewProject={() => navigate("projects")} /> : null}
        <div className="a008-sidebar-workspace" hidden={sidebarHidden}>
          <p className="a008-sidebar-caption">Workspace</p>
          <p className="a008-workspace-name" title={workspace}>
            {workspace || "No project bound"}
          </p>
          <p className="a008-sidebar-hint">
            {session.status === "ready"
              ? "V2 session attached."
              : "Unlock with PIN, then choose a project."}
          </p>
        </div>
        <details className="a008-runtime-details" hidden={sidebarHidden}>
          <summary>Runtime details</summary>
          <SettingsPane session={session} />
        </details>
        <div className="a008-sidebar-footer" hidden={sidebarHidden}>
          <img
            className="a008-certified"
            src="/acme-engine-certified.png"
            alt="Running ACME-engine certified"
            width={1280}
            height={1164}
          />
          <p>A008 ? Desktop 0.1</p>
        </div>
      </aside>
      <div className="a008-sidebar-resizer" role="separator" aria-label="Resize sidebar" aria-orientation="vertical" aria-valuemin={208} aria-valuemax={480} aria-valuenow={sidebarWidth} tabIndex={0} onPointerDown={beginSidebarResize} onKeyDown={(event) => { if (event.key === "ArrowLeft") resizeSidebar(sidebarWidth - 16); else if (event.key === "ArrowRight") resizeSidebar(sidebarWidth + 16); else if (event.key === "Home") resizeSidebar(208); else if (event.key === "End") resizeSidebar(480); else return; event.preventDefault(); }} />
      <header className="a008-header">
        <div className="a008-header-title">
          <button
            className="a008-navigation-toggle"
            aria-label="Toggle navigation"
            aria-expanded={navigationOpen}
            aria-controls="a008-navigation"
            onClick={() => setNavigationOpen(!navigationOpen)}
            type="button"
          >
            ?
          </button>
          <button className="a008-sidebar-toggle" type="button" aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"} aria-pressed={!sidebarHidden} onClick={() => { const hidden = !sidebarHidden; setSidebarHidden(hidden); setProjectSidebarOpen(!hidden); persistSidebarHidden(hidden); }}>{sidebarHidden ? "Show sidebar" : "Hide sidebar"}</button>
          <span>
            {page === "chat"
              ? "Conversation"
              : page === "memory"
                ? "Memory"
                : page === "help"
                  ? "Help"
                  : page === "projects"
                    ? "Projects"
                    : page === "platform"
                      ? "Platform"
                      : "Tools"}
          </span>
          <span className="a008-header-workspace" title={selectedConversationId ? `Conversation ${selectedConversationId}` : workspace}>{workspace}{selectedConversationId ? ` · ${selectedConversationId.slice(0, 12)}` : ""}</span>
        </div>
        <nav className="a008-application-menu" aria-label="Application menu">
          {([ ["file", "File", [["new-chat", "New chat"], ["files", "Files"]]], ["edit", "Edit", [["parameters", "Parameters"]]], ["view", "View", [["toggle-sidebar", sidebarHidden ? "Show sidebar" : "Hide sidebar"]]], ["help", "Help", [["help", "Help"]]] ] as const).map(([id, label, items]) => <div key={id} className="a008-menu-group"><button type="button" aria-haspopup="menu" aria-expanded={menu === id} onClick={() => setMenu(menu === id ? "" : id)}>{label}</button>{menu === id ? <div role="menu" className="a008-menu-popup">{items.map(([action, text]) => <button key={action} type="button" role="menuitem" onClick={() => { setMenu(""); if (action === "new-chat") { setNewChatRequest((value) => value + 1); setPage("platform"); } else if (action === "files") { setPage("chat"); setFilesOpen(true); } else if (action === "parameters") setParametersOpen(true); else if (action === "toggle-sidebar") { const hidden = !sidebarHidden; setSidebarHidden(hidden); setProjectSidebarOpen(!hidden); persistSidebarHidden(hidden); } else if (action === "help") setPage("help"); }}>{text}</button>)}</div> : null}</div>)}
        </nav>
        <div className="a008-header-actions">
          <p className="a008-header-status">
            <span className={`a008-connection-dot a008-connection-${session.status}`} aria-hidden="true" />
            {STATUS_LABEL[session.status]}
          </p>
          <button
            className="a008-parameters-open"
            type="button"
            onClick={() => setParametersOpen(true)}
            aria-haspopup="dialog"
          >
            Parameters
          </button>
          {page === "chat" ? (
            <>
              <button
                className="a008-panel-toggle"
                type="button"
                aria-expanded={canvasOpen}
                aria-controls="a008-code-canvas-panel"
                onClick={() => {
                  setCanvasOpen(!canvasOpen);
                  setFilesOpen(false);
                  setToolsOpen(false);
                }}
              >
                Canvas{artifact ? " ?" : ""}
              </button>
              <button
                className="a008-panel-toggle"
                type="button"
                aria-expanded={filesOpen}
                aria-controls="a008-files-panel"
                onClick={() => {
                  setFilesOpen(!filesOpen);
                  setCanvasOpen(false);
                }}
              >
                Files
              </button>
              <button
                className="a008-panel-toggle"
                type="button"
                aria-expanded={toolsOpen}
                aria-controls="a008-tools-panel"
                onClick={() => {
                  setToolsOpen(!toolsOpen);
                  setCanvasOpen(false);
                }}
              >
                Workbench
              </button>
            </>
          ) : null}
        </div>
      </header>
      <main className="a008-main" hidden={page !== "chat"}>
        {session.status === "ready" ? (
          <>
            <ChatPane
              session={session}
              onStartPrompt={(prompt) => void ask(prompt)}
              onArtifactOpen={openArtifact}
              onArtifactCandidate={considerArtifact}
            />
            <Composer
              session={session}
              httpBase={endpoints.httpBase}
              onParameters={() => setParametersOpen(true)}
              onSkillSelected={setSelectedSkill}
              onImage={(prompt) => void ask(prompt)}
            />
          </>
        ) : (
          <ConnectPage
            host={host}
            projectId={projectId}
            model={model}
            error={session.status === "error" ? session.error : undefined}
            busy={session.status === "connecting"}
            onSubmit={connect}
          />
        )}
      </main>
      <main className="a008-memory-main" hidden={page !== "memory"}>
        <MemoryPage active={page === "memory"} />
      </main>
      <div className="a008-tools-panel" hidden={page !== "tools"}>
        <ToolsPage
          session={session}
          selectedId={toolSurface}
          onSelect={setToolSurface}
          onAsk={(prompt) => void ask(prompt)}
        />
      </div>
      <main className="a008-help-main" hidden={page !== "help"}>
        <HelpPage session={session} onChat={(prompt) => void ask(prompt)} />
      </main>
      <main className="a008-help-main" hidden={page !== "platform"}>
        <PlatformPage active={page === "platform"} model={model} requestedProjectId={projectId} requestedConversationId={selectedConversationId} requestNewChat={newChatRequest} />
      </main>
      <main className="a008-help-main" hidden={page !== "projects"}>
        <ProjectsPage
          httpBase={endpoints.httpBase}
          boundProjectId={session.projectId}
          onSelect={(nextId) => {
            const next = {
              host,
              projectId: nextId,
              credential: "",
              model,
            };
            persistConnection(next);
            setProjectId(nextId);
            session.configure(next);
            void session.connect();
            navigate("chat");
          }}
        />
      </main>
      <ShortcutDock
        hidden={page !== "chat" || filesOpen || toolsOpen || canvasOpen || session.status !== "ready"}
        open={shortcutsOpen}
        onShortcut={onShortcut}
        onHide={() => {
          setShortcutsOpen(false);
          persistShortcutDockVisible(false);
        }}
        onOpen={() => {
          setShortcutsOpen(true);
          setFilesOpen(false);
          setToolsOpen(false);
          setCanvasOpen(false);
          persistShortcutDockVisible(true);
        }}
      />
      <aside
        className="a008-code-canvas-float"
        id="a008-code-canvas-panel"
        hidden={page !== "chat" || !canvasOpen}
      >
        <CodeArtifactPanel
          artifact={artifact}
          pending={pendingArtifact}
          onClose={() => setCanvasOpen(false)}
          onPrompt={(prompt) => void ask(prompt)}
          onSourceChange={(source) =>
            setArtifact((current) =>
              current
                ? {
                    ...current,
                    source,
                    dirty: source !== current.modelSource,
                  }
                : current,
            )
          }
          onRevert={() =>
            setArtifact((current) =>
              current ? { ...current, source: current.modelSource, dirty: false } : current,
            )
          }
          onUseModelUpdate={() => {
            if (!pendingArtifact) return;
            setArtifact(modelArtifact(pendingArtifact));
            setPendingArtifact(undefined);
          }}
        />
      </aside>
      <aside className="a008-files-float" id="a008-files-panel" hidden={page !== "chat" || !filesOpen}>
        <FilesPane
          session={session}
          onOpen={(path) => void ask(readFilePrompt(path))}
          onList={() => void ask(LIST_FILES_PROMPT)}
        />
      </aside>
      <aside
        className="a008-environment-float"
        id="a008-tools-panel"
        hidden={page !== "chat" || !toolsOpen}
      >
        <EnvironmentPanel
          session={session}
          projectLabel={workspace}
          onChat={() => navigate("chat")}
          onShowAllSources={() => openTools("upload")}
        />
      </aside>
    </div>
  );
}
