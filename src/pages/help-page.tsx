import "./client.css";

export function HelpPage() {
  return (
    <section className="a008-help" aria-label="Help">
      <header>
        <p>Reference</p>
        <h1>Help</h1>
      </header>
      <p>
        This desktop client is version 0.1. Unlock with the same six-digit PIN
        as the A008 GUI, choose a registered project, then chat over V2.
        Memory, Tools and project bootstrap wait for later host stages.
      </p>
      <section aria-label="Keyboard shortcuts">
        <h2>Shortcuts</h2>
        <ul>
          <li>
            <span>Send message</span> <kbd>Enter</kbd>
          </li>
          <li>
            <span>New line</span> <kbd>Shift+Enter</kbd>
          </li>
          <li>
            <span>Composer commands</span> <kbd>/help</kbd>
          </li>
        </ul>
      </section>
      <section aria-label="Live host operations">
        <h2>What 0.1 can do</h2>
        <ul>
          <li>
            <code>POST /auth/login</code> — owner PIN cookie
          </li>
          <li>
            <code>GET /v1/projects</code> — registered project list
          </li>
          <li>
            <code>GET /v2/info</code> — public protocol discovery
          </li>
          <li>
            <code>POST /v2/auth/ticket</code> — PIN cookie or device Bearer
          </li>
          <li>
            <code>WS /v2/session</code> — <code>session/new</code>, <code>prompt</code>,{" "}
            <code>cancel</code>, <code>control</code>, <code>tool/permission</code>
          </li>
        </ul>
      </section>
      <section aria-label="Not yet on the host">
        <h2>Not on the current host</h2>
        <ul>
          <li>V2 HTTP for projects, memory, upload, images, shell, catalog</li>
          <li>Session resume / reconnect lease (V2 Stage 4)</li>
          <li>Command idempotency receipts</li>
        </ul>
      </section>
    </section>
  );
}
