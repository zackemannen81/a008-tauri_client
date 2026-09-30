import { BrowserPane } from "../browser/browser-pane.js";
import { FilesPane, readFilePrompt } from "../files/files-pane.js";
import type { ClientSession } from "../session/types.js";
import { TerminalPane } from "../terminal/terminal-pane.js";
import { UploadPane } from "../upload/upload-pane.js";
import { Workbench } from "../workbench/workbench.js";
import "./client.css";

export type ToolSurface = "terminal" | "files" | "browser" | "upload";

export function ToolsPage(props: {
  readonly session: ClientSession;
  readonly selectedId: ToolSurface;
  readonly onSelect: (id: ToolSurface) => void;
  readonly onAsk: (prompt: string) => void;
}) {
  return (
    <Workbench
      label="Tools"
      selectedId={props.selectedId}
      onSelect={(id) => props.onSelect(id as ToolSurface)}
      surfaces={[
        {
          id: "terminal",
          label: "Terminal",
          render: () => <TerminalPane />,
        },
        {
          id: "files",
          label: "Files",
          render: () => (
            <FilesPane session={props.session} onOpen={(path) => props.onAsk(readFilePrompt(path))} />
          ),
        },
        {
          id: "browser",
          label: "Browser",
          render: () => <BrowserPane />,
        },
        {
          id: "upload",
          label: "Upload",
          render: () => <UploadPane />,
        },
      ]}
    />
  );
}
