import "./client.css";

export function MemoryPage() {
  return (
    <section className="a008-unavailable" aria-label="Memory">
      <header>
        <p>Diagnostics</p>
        <h1>Memory</h1>
      </header>
      <p>
        The A008 GUI Memory page (Overview, Relationship map, Knowledge manager)
        reads <code>GET /v1/memory</code> against the host&apos;s global V1
        workspace. V2 chat binds a registered project through
        <code> ProjectRuntimeRegistry</code>, so that V1 inspect path would show
        the wrong namespace.
      </p>
      <div className="a008-capability">
        <strong>Waiting on the host</strong>
        <p>
          <code>GET /v2/projects/{"{projectId}"}/memory</code> is in CLIENT_API_V2.md
          and is not implemented. The current host answers unknown V2 HTTP as
          <code> UNSUPPORTED_CAPABILITY</code>.
        </p>
      </div>
    </section>
  );
}
