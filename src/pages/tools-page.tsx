import "./client.css";

const SURFACES = [
  {
    title: "Terminal",
    detail: "POST /v2/projects/{projectId}/shell is not implemented. V1 /v1/shell runs in the host process cwd, not the V2 project binding.",
  },
  {
    title: "Files",
    detail: "File tools execute through the chat permission loop once a session is connected. There is no separate V2 filesystem HTTP.",
  },
  {
    title: "Browser",
    detail: "GET /v2/browser/frame-check is not implemented. V1 frame-check stays on the host origin probe.",
  },
  {
    title: "Upload",
    detail: "POST /v2/projects/{projectId}/upload is not implemented. V1 upload writes the host source store of the V1 workspace.",
  },
] as const;

export function ToolsPage() {
  return (
    <section className="a008-unavailable" aria-label="Tools">
      <header>
        <p>Workbench</p>
        <h1>Tools</h1>
      </header>
      <p>
        Model tools still run inside the V2 session. Approve them from Chat.
        These side panels need V2 HTTP that Stage 3 does not expose.
      </p>
      <div className="a008-tools-grid">
        {SURFACES.map((surface) => (
          <article className="a008-capability" key={surface.title}>
            <strong>{surface.title}</strong>
            <p>{surface.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
