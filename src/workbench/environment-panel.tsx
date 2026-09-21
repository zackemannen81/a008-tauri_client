import { useEffect, useState } from "react";
import type { ClientSession } from "../session/types.js";
import { loadWorkspaceStatus } from "./workspace-status.js";
import "./environment.css";

export const WORKBENCH_PROMPTS = {
  review:
    "Granska ändringarna i arbetskopian med git status, git diff och git diff --cached. Läs berörda filer vid behov och sammanfatta fynden.",
  commit:
    "Check the working tree with git status and git diff. Stage and commit only when the changes are ready, then push if a configured upstream exists. Use the Git tool. Summarise what you did.",
  compare:
    "Compare the current branch with its upstream, or with main if no upstream is set. Use git status, git log and git diff. Summarise commits and unpushed work.",
} as const;

export function EnvironmentPanel(props: {
  readonly session: ClientSession;
  readonly projectLabel?: string;
  readonly onChat: () => void;
  readonly onShowAllSources: () => void;
}) {
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<string>("Connect to inspect git status.");
  const ready = props.session.status === "ready" && !props.session.busy;

  useEffect(() => {
    if (props.session.status !== "ready") return;
    void loadWorkspaceStatus().then((next) => {
      if (!next.isRepo) {
        setStatus("Not a Git repository, or git status is unavailable.");
        return;
      }
      const tracking = next.upstream
        ? `${next.branch}…${next.upstream} +${String(next.ahead)}/−${String(next.behind)}`
        : next.branch;
      setStatus(`${tracking} · ${String(next.changedFiles)} changed · +${String(next.added)}/−${String(next.removed)}`);
    });
  }, [props.session.status]);

  async function ask(prompt: string): Promise<void> {
    setError(undefined);
    props.onChat();
    try {
      await props.session.prompt(prompt);
    } catch {
      /* ChatPane renders session.error */
    }
  }

  return (
    <section className="a008-environment" aria-label="Workbench">
      <div className="a008-environment-section">
        <header>
          <h2>Environment</h2>
        </header>
        <button
          type="button"
          className="a008-environment-row"
          disabled={!ready}
          onClick={() => void ask(WORKBENCH_PROMPTS.review)}
        >
          <span aria-hidden="true">±</span>
          <span>Changes</span>
        </button>
        <p className="a008-environment-row a008-environment-static">
          <span aria-hidden="true">⌂</span>
          <span>Local</span>
        </p>
        <p className="a008-environment-detail">
          {props.projectLabel ? `Bound project ${props.projectLabel}. ${status}` : status}
        </p>
        <button
          type="button"
          className="a008-environment-row"
          disabled={!ready}
          onClick={() => void ask(WORKBENCH_PROMPTS.commit)}
        >
          <span aria-hidden="true">○</span>
          <span>Commit or push</span>
        </button>
        <p className="a008-environment-row a008-environment-static">
          <span aria-hidden="true">◌</span>
          <span>Pull request status is unavailable</span>
        </p>
        <button
          type="button"
          className="a008-environment-row"
          disabled={!ready}
          onClick={() => void ask(WORKBENCH_PROMPTS.compare)}
        >
          <span aria-hidden="true">↗</span>
          <span>Compare branch</span>
        </button>
      </div>
      <div className="a008-environment-section">
        <header>
          <h2>Sources</h2>
        </header>
        <p className="a008-environment-empty">Use Tools → Upload to ingest a source file into the host store.</p>
        <button type="button" className="a008-environment-row" onClick={props.onShowAllSources}>
          <span aria-hidden="true">↗</span>
          <span>Show all</span>
        </button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
