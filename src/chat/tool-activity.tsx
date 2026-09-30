import type { ToolCall } from "../session/types.js";

export type ToolDisplayStatus = "running" | "ok" | "recovered" | "failed";

export function displayToolStatus(tool: ToolCall): ToolDisplayStatus {
  if (tool.status === "running" || tool.status === "pending" || tool.status === "in_progress") {
    return "running";
  }
  if (tool.status === "ok" || tool.status === "completed") return "ok";
  if (tool.recoveredBy) return "recovered";
  return "failed";
}

export function toolDisplayName(tool: ToolCall): string {
  return tool.tool || tool.title || "tool";
}

export function groupToolCalls(tools: readonly ToolCall[]): ReadonlyMap<string, readonly ToolCall[]> {
  const grouped = new Map<string, ToolCall[]>();
  for (const tool of tools) {
    const name = toolDisplayName(tool);
    const entries = grouped.get(name) ?? [];
    entries.push(tool);
    grouped.set(name, entries);
  }
  return grouped;
}

function duration(tool: ToolCall): string {
  if (tool.startedAt === undefined || tool.finishedAt === undefined) return "";
  return `${Math.max(0, (tool.finishedAt - tool.startedAt) / 1000).toFixed(1)}s`;
}

function displayText(tool: ToolCall): string {
  return tool.argsSummary ?? tool.text ?? tool.errorSummary ?? "";
}

function statusIcon(status: ToolDisplayStatus): string {
  if (status === "ok") return "✓";
  if (status === "recovered") return "↻";
  if (status === "running") return "⚙";
  return "✕";
}

export function ToolActivity({ tools }: { readonly tools?: readonly ToolCall[] }) {
  if (!tools?.length) return null;
  const grouped = groupToolCalls(tools);
  const counts = tools.reduce(
    (result, tool) => {
      result[displayToolStatus(tool)] += 1;
      return result;
    },
    { running: 0, ok: 0, recovered: 0, failed: 0 },
  );
  const completed = counts.running === 0;
  return (
    <section className="a008-tool-activity" aria-label="Tool activity">
      <details className="a008-tool-summary" open={!completed}>
        <summary>
          {completed ? "✓" : "⚙"} Tools · {tools.length} calls · {completed ? "completed" : "running"}
        </summary>
        <div className="a008-tool-summary-counts">
          {counts.ok} ok · {counts.recovered} recovered · {counts.failed} failed · {counts.running} running
        </div>
        <div className="a008-tool-groups">
          {Array.from(grouped, ([name, entries]) => {
            const recovered = entries.filter((tool) => displayToolStatus(tool) === "recovered").length;
            const failed = entries.filter((tool) => displayToolStatus(tool) === "failed").length;
            const ok = entries.filter((tool) => displayToolStatus(tool) === "ok").length;
            const running = entries.filter((tool) => displayToolStatus(tool) === "running").length;
            return (
              <details key={name} open={running > 0}>
                <summary>
                  {name} ×{entries.length} · ✓ {ok}
                  {recovered ? ` · ↻ ${recovered}` : ""}
                  {failed ? ` · ✕ ${failed}` : ""}
                  {running ? ` · ⚙ ${running}` : ""}
                </summary>
                {entries.map((tool) => {
                  const status = displayToolStatus(tool);
                  return (
                    <div key={tool.id} className={`a008-tool-row a008-tool-${status}`}>
                      <span>{statusIcon(status)}</span>
                      <span>{displayText(tool) || name}</span>
                      <span>
                        {tool.status}
                        {tool.status === "pending" ? " — awaiting approval" : ""}
                        {duration(tool) ? ` · ${duration(tool)}` : ""}
                      </span>
                      <span className="a008-tool-legacy-label">{name} · {tool.status}</span>
                      {tool.errorSummary ? <small>{tool.errorSummary}</small> : null}
                    </div>
                  );
                })}
              </details>
            );
          })}
        </div>
        <details className="a008-tool-raw">
          <summary>Raw trace</summary>
          <pre>{JSON.stringify(tools, null, 2)}</pre>
        </details>
      </details>
    </section>
  );
}
