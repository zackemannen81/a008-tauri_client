import { useEffect, useState } from "react";
import { tryListProjects, type ListedProject } from "../host/v2-http.js";
import "./client.css";

export function ProjectsPage(props: {
  readonly httpBase: string;
  readonly boundProjectId?: string;
  readonly onSelect: (projectId: string) => void;
}) {
  const [projects, setProjects] = useState<readonly ListedProject[] | undefined>();
  const [unavailable, setUnavailable] = useState("");

  useEffect(() => {
    void tryListProjects(props.httpBase).then((listed) => {
      if (listed === undefined) {
        setUnavailable("Unlock with the owner PIN on Connect to read the host project registry.");
        return;
      }
      setProjects(listed.projects);
    });
  }, [props.httpBase]);

  return (
    <section className="a008-projects" aria-label="Projects">
      <header>
        <p>Project binding</p>
        <h1>Projects</h1>
      </header>
      <p className="a008-note">
        A V2 socket is bound to one registered project. Creating or opening a
        project through V1 would switch the host&apos;s global workspace, which is
        the wrong owner for this client. Select a listed ID and reconnect, or
        paste the ID on Connect.
      </p>
      {props.boundProjectId ? (
        <div className="a008-capability">
          <strong>Bound project</strong>
          <p>
            <code>{props.boundProjectId}</code>
          </p>
        </div>
      ) : null}
      {unavailable ? <p className="a008-note">{unavailable}</p> : null}
      {projects && projects.length === 0 ? <p className="a008-note">The host registry has no projects.</p> : null}
      {projects && projects.length > 0 ? (
        <ul className="a008-project-list">
          {projects.map((project) => (
            <li key={project.projectId}>
              <button type="button" onClick={() => props.onSelect(project.projectId)}>
                {project.name}
                <span>{project.projectId}</span>
                {project.rootFolder ? <span>{project.rootFolder}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="a008-capability">
        <strong>Waiting on the host</strong>
        <p>
          <code>/v2/projects</code>, browse, bootstrap and register are not
          implemented. New-project and add-existing stay in the A008 GUI until
          those routes exist.
        </p>
      </div>
    </section>
  );
}
