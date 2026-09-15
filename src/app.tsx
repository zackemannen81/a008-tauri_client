import { useMemo, useState } from "react";
import { BrandMark } from "./brand/brand-mark.js";
import { ChatPane } from "./chat/chat-pane.js";
import { Composer } from "./chat/composer.js";
import { resolveHostEndpoints } from "./host/v2-http.js";
import { persistConnection, readStoredConnection } from "./host/storage.js";
import { ConnectPage } from "./pages/connect-page.js";
import { HelpPage } from "./pages/help-page.js";
import { MemoryPage } from "./pages/memory-page.js";
import { ProjectsPage } from "./pages/projects-page.js";
import { ToolsPage } from "./pages/tools-page.js";
import { ParametersPanel } from "./settings/parameters-panel.js";
import { ToolPermissionDialog } from "./session/tool-permission-dialog.js";
import { useV2Session } from "./session/use-v2-session.js";

const STATUS_LABEL = {
  idle: "Not connected",
  connecting: "Connecting",
  ready: "Connected",
  error: "Runtime error",
} as const;

type Page = "chat" | "memory" | "tools" | "help" | "projects";

export function App() {
  const session = useV2Session();
  const stored = readStoredConnection();
  const [page, setPage] = useState<Page>("chat");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [parametersOpen, setParametersOpen] = useState(false);
  const [host, setHost] = useState(stored?.host ?? "");
  const [projectId, setProjectId] = useState(stored?.projectId ?? "");
  const [model, setModel] = useState(stored?.model ?? session.model);
  const [projectName, setProjectName] = useState(stored?.projectName ?? "");
  const endpoints = useMemo(() => resolveHostEndpoints(host), [host]);
  const workspace = projectName || session.projectId || projectId;

  function navigate(next: Page) {
    setPage(next);
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

  return (
    <div
      className={`a008-app a008-${page}-workspace${navigationOpen ? " a008-navigation-open" : ""}`}
    >
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
        <nav className="a008-sidebar-nav" aria-label="Workspace">
          <button type="button" aria-current={page === "chat" ? "page" : undefined} onClick={() => navigate("chat")}>
            <span aria-hidden="true">◌</span> Chat
          </button>
          <button
            type="button"
            aria-current={page === "memory" ? "page" : undefined}
            onClick={() => navigate("memory")}
          >
            <span aria-hidden="true">◇</span> Memory
          </button>
          <button
            type="button"
            aria-current={page === "tools" ? "page" : undefined}
            onClick={() => navigate("tools")}
          >
            <span aria-hidden="true">⌘</span> Tools
          </button>
          <button type="button" aria-current={page === "help" ? "page" : undefined} onClick={() => navigate("help")}>
            <span aria-hidden="true">?</span> Help
          </button>
          <button
            type="button"
            aria-current={page === "projects" ? "page" : undefined}
            onClick={() => navigate("projects")}
          >
            <span aria-hidden="true">▣</span> Projects
          </button>
        </nav>
        <div className="a008-sidebar-workspace">
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
        <div className="a008-sidebar-footer">
          <img
            className="a008-certified"
            src="/acme-engine-certified.png"
            alt="Running ACME-engine certified"
            width={1280}
            height={1164}
          />
          <p>A008 · Desktop 0.1</p>
        </div>
      </aside>
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
            ☰
          </button>
          <span>
            {page === "chat"
              ? "Conversation"
              : page === "memory"
                ? "Memory"
                : page === "help"
                  ? "Help"
                  : page === "projects"
                    ? "Projects"
                    : "Tools"}
          </span>
          <span className="a008-header-workspace">{workspace}</span>
        </div>
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
        </div>
      </header>
      <main className="a008-main" hidden={page !== "chat"}>
        {session.status === "ready" ? (
          <>
            <ChatPane session={session} onStartPrompt={(prompt) => void ask(prompt)} />
            <Composer session={session} onParameters={() => setParametersOpen(true)} />
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
        <MemoryPage />
      </main>
      <main className="a008-help-main" hidden={page !== "tools"}>
        <ToolsPage />
      </main>
      <main className="a008-help-main" hidden={page !== "help"}>
        <HelpPage />
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
    </div>
  );
}
