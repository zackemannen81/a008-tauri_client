import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import type { ClientSession } from "../session/types.js";
import { parseSlash, SLASH_HELP } from "./slash.js";

export function Composer(props: {
  readonly session: ClientSession;
  readonly onParameters?: () => void;
}) {
  const inputId = useId();
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const connected = props.session.status === "ready";
  const canSend = connected && !props.session.busy && !pending;

  async function run(text: string): Promise<void> {
    setError("");
    setNotice("");
    let parsed;
    try {
      parsed = parseSlash(text);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid command.");
      return;
    }
    if (parsed === undefined) {
      await props.session.prompt(text);
      setDraft("");
      return;
    }
    switch (parsed.name) {
      case "help":
        setNotice(SLASH_HELP);
        setDraft("");
        return;
      case "exit":
        await props.session.disconnect();
        setNotice("Session ended. Connect to start a new conversation.");
        setDraft("");
        return;
      case "reset":
        await props.session.controlSession({ action: "reset" });
        setNotice("Conversation cleared. Saved memory remains.");
        setDraft("");
        return;
      case "undo": {
        const state = await props.session.controlSession({ action: "undo" });
        setNotice(state.undone ? "Last committed turn undone. Saved memory remains." : "Nothing to undo.");
        setDraft("");
        return;
      }
      case "history": {
        const state = await props.session.controlSession({ action: "inspect" });
        setNotice(
          state.messages.length === 0
            ? "No conversation turns."
            : state.messages.map((message) => `${message.role}: ${message.content}`).join("\n\n"),
        );
        setDraft("");
        return;
      }
      case "model":
        if (parsed.argument !== "") {
          const state = await props.session.controlSession({ action: "model", model: parsed.argument });
          setNotice(`Model: ${state.model}\nNew conversation started with this model's runtime defaults.`);
        } else {
          setNotice(`Current: ${props.session.model}\n/model <id> starts a new conversation.`);
        }
        setDraft("");
        return;
      case "status": {
        const state = await props.session.controlSession({ action: "inspect" });
        setNotice(
          `model: ${state.model}\nstatus: ${props.session.status}\nsession: ${state.sessionId}\nproject: ${state.projectId}\ntools: ${state.tools?.map((tool) => tool.name).join(", ") || "(none advertised)"}`,
        );
        setDraft("");
        return;
      }
      case "tools":
        setNotice(
          props.session.details?.tools?.map((tool) => `${tool.name}  ${tool.description}`).join("\n") ||
            "No model tools advertised on this session.",
        );
        setDraft("");
        return;
      case "shell":
      case "cwd":
        setError(
          parsed.name === "shell"
            ? "/shell is not available: POST /v2/projects/{id}/shell is not implemented on the current host."
            : "Working directory is omitted from V2 session snapshots. /cwd waits for V2 project metadata.",
        );
        return;
    }
  }

  async function submitDraft(): Promise<void> {
    if (!canSend || draft.trim().length === 0) return;
    setPending(true);
    try {
      await run(draft.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Composer submit failed.");
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitDraft();
    }
  }

  return (
    <section className="a008-composer" aria-label="Message">
      <div className="a008-composer-card">
        <form
          className="a008-composer-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void submitDraft();
          }}
        >
          <div className="a008-composer-top">
            <label className="a008-composer-label" htmlFor={inputId}>
              Message
            </label>
            <textarea
              id={inputId}
              className="a008-composer-input"
              rows={1}
              placeholder={connected ? "Message A008" : "Connect to send a message"}
              value={draft}
              disabled={!connected || pending}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
            />
            {props.session.busy ? (
              <button className="a008-composer-send" type="button" onClick={() => void props.session.cancel()}>
                Stop
              </button>
            ) : (
              <button className="a008-composer-send" type="submit" disabled={!canSend || draft.trim() === ""}>
                Send
              </button>
            )}
          </div>
          <div className="a008-composer-footer">
            <button type="button" onClick={props.onParameters}>
              {props.session.model}
            </button>
            <span>Enter to send · Shift+Enter for a new line · /help</span>
          </div>
        </form>
      </div>
      {error ? <p className="a008-composer-error">{error}</p> : null}
      {notice ? <pre className="a008-composer-notice">{notice}</pre> : null}
    </section>
  );
}
