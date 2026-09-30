import type { ClientSession } from "../session/types.js";
import "./client.css";

export const HELP_SHORTCUTS = [
  { action: "Review working tree", keys: "Ctrl+Shift+G" },
  { action: "Open Terminal", keys: "Ctrl+`" },
  { action: "Open Browser", keys: "Ctrl+T" },
  { action: "Find files", keys: "Ctrl+P" },
  { action: "Toggle workbench", keys: "Ctrl+Alt+S" },
  { action: "Send message", keys: "Enter" },
  { action: "New line", keys: "Shift+Enter" },
] as const;

export const REPOSITORY_ACTIONS = [
  {
    label: "Read AGENTS.md & list root",
    prompt:
      "Läs AGENTS.md och lista filerna och mapparna i projektroten med dina verktyg. Redovisa vad du faktiskt hittar.",
  },
  {
    label: "Git status",
    prompt:
      "Använd Git-verktyget för att visa aktuell gren och arbetskopians status. Sammanfatta resultatet.",
  },
  {
    label: "Review changes",
    prompt:
      "Granska ändringarna i arbetskopian med git status, git diff och git diff --cached. Läs berörda filer vid behov och sammanfatta fynden.",
  },
] as const;

export function HelpPage(props: {
  readonly session: ClientSession;
  readonly onChat: (prompt: string) => void;
}) {
  const ready = props.session.status === "ready" && !props.session.busy;
  const tools = props.session.details?.tools ?? [];

  return (
    <section className="a008-help" aria-label="Help">
      <header>
        <p>Reference</p>
        <h1>Help</h1>
      </header>
      <p>
        Unlock with the same six-digit PIN as the A008 GUI, choose a registered project, then chat
        over V2. Tool catalog, shortcuts and repository prompts live here. Memory, Terminal, Upload
        and Provider/MCP use the same owner HTTP routes as the A008 GUI.
      </p>
      <section className="a008-help-shortcuts" aria-label="Keyboard shortcuts">
        <h2>Shortcuts</h2>
        <ul>
          {HELP_SHORTCUTS.map((item) => (
            <li key={item.keys}>
              <span>{item.action}</span>
              <kbd>{item.keys}</kbd>
            </li>
          ))}
          <li>
            <span>Composer commands</span> <kbd>/help</kbd>
          </li>
        </ul>
      </section>
      <section aria-label="Repository tools">
        <h2>Repository</h2>
        <p>
          These buttons send a chat prompt. Use Tools → Terminal for host shell commands.
        </p>
        <div className="a008-help-actions">
          {REPOSITORY_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={!ready}
              onClick={() => props.onChat(action.prompt)}
            >
              {action.label}
            </button>
          ))}
        </div>
        <h3>Model tools</h3>
        {tools.length > 0 ? (
          <ul>
            {tools.map((tool) => (
              <li key={tool.name}>
                <code>{tool.name}</code> {tool.description}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {props.session.status === "ready"
              ? "No model tools advertised on this session snapshot."
              : "Connect to load the session tool catalog."}
          </p>
        )}
      </section>
      <section aria-label="Live host operations">
        <h2>What this client can do</h2>
        <ul>
          <li>
            <code>POST /auth/login</code> — owner PIN cookie
          </li>
          <li>
            <code>GET /v1/projects</code> — registered project list
          </li>
          <li>
            <code>GET /v1/models</code> — model ids and generation capabilities
          </li>
          <li>
            <code>GET /v2/info</code> — public protocol discovery
          </li>
          <li>
            <code>POST /v2/auth/ticket</code> — PIN cookie or device Bearer
          </li>
          <li>
            <code>WS /v2/session</code> — <code>session/new</code>, <code>prompt</code>,{" "}
            <code>cancel</code>, <code>control</code> (including configure),{" "}
            <code>tool/permission</code>
          </li>
        </ul>
      </section>
      <section aria-label="Not yet on the host">
        <h2>Not on the current host</h2>
        <ul>
          <li>V2 HTTP for projects admin, memory, upload, images, shell, catalog</li>
          <li>V2 snapshot cwd, memory path, and project-scoped runtime preferences</li>
          <li>Session resume / reconnect lease (V2 Stage 4)</li>
          <li>Command idempotency receipts</li>
        </ul>
      </section>
    </section>
  );
}
