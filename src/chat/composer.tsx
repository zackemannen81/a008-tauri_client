import { useId, useEffect, useState, useRef, type FormEvent, type KeyboardEvent, type ChangeEvent, type DragEvent, type ClipboardEvent } from "react";
import { tryListModels } from "../host/v2-http.js";
import type { ClientSession } from "../session/types.js";
import type { UploadableFile, UploadedSource } from "../host/v1-http.js";
import { parseSlash, SLASH_HELP } from "./slash.js";
import { uploadSource, uploadSourcePath } from "../host/v1-http.js";
import { loadSkills, discoverSkillCatalog, installDiscoveredSkill, removeInstalledSkill, uploadImageFile, uploadImagePath, storedImageUrl, type InstalledSkill as Skill } from "../platform/platform-client.js";

export function Composer(props: {
  readonly session: ClientSession;
  readonly httpBase?: string;
  readonly onParameters?: () => void;
  readonly skill?: Skill;
  readonly onSkillSelected?: (skill: Skill | undefined) => void;
  readonly onImage?: (prompt: string) => void;
}) {
  const inputId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const attachMenu = useRef<HTMLDetailsElement>(null);
  const [attachment, setAttachment] = useState<(UploadedSource & { readonly name: string })>();
  const [localPath, setLocalPath] = useState("");
  const [showPathInput, setShowPathInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [skills, setSkills] = useState<readonly Skill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  useEffect(() => { let live = true; void loadSkills().then((next) => { if (live) setSkills(next); }).catch(() => undefined); const refresh = () => { void loadSkills().then((next) => { if (live) setSkills(next); }).catch(() => undefined); }; window.addEventListener("a008-skills-changed", refresh); return () => { live = false; window.removeEventListener("a008-skills-changed", refresh); }; }, []);
  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId);
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
      await props.session.prompt(text, attachment ? { type: "image", locator: attachment.locator, mediaType: attachment.mediaType } : undefined);
      setAttachment(undefined);
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
        } else if (props.httpBase) {
          const listed = await tryListModels(props.httpBase);
          const registry = listed?.map((item) => `${item.id}  ${item.name}`).join("\n");
          setNotice(
            `Current: ${props.session.model}\n\n${registry || "(model catalog unavailable)"}\n\n/model <id> starts a new conversation.`,
          );
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
        if (parsed.argument === "") {
          setDraft("/shell ");
          return;
        }
        setNotice(await runShellCommand(parsed.argument));
        setDraft("");
        return;
      case "cwd":
        setNotice(await runShellCommand("pwd"));
        setDraft("");
        return;
    }
  }

  function acceptUploadedImage(uploaded: UploadedSource, name: string): void {
    if (!uploaded.mediaType.toLowerCase().startsWith("image/")) throw new Error(`Selected source is ${uploaded.mediaType}, not an image.`);
    setAttachment({ ...uploaded, name });
  }
  async function attachImage(file: File | undefined): Promise<void> {
    if (!file) return;
    setUploading(true); setError("");
    try { const uploadable: UploadableFile = file.name.trim() ? file : new File([file], "clipboard-image", { type: file.type }); acceptUploadedImage(await uploadImageFile(uploadable), uploadable.name); if (attachMenu.current) attachMenu.current.open = false; }
    catch (error) { setError(error instanceof Error ? error.message : "Image upload failed."); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
  }
  async function attachLocalPath(): Promise<void> {
    const path = localPath.trim(); if (!path) { setError("Enter an absolute local file path."); return; }
    setUploading(true); setError("");
    try { const uploaded = await uploadImagePath(path); acceptUploadedImage(uploaded, path.split(/[\\/]/u).filter(Boolean).at(-1) ?? path); setLocalPath(""); setShowPathInput(false); }
    catch (error) { setError(error instanceof Error ? error.message : "Image upload failed."); }
    finally { setUploading(false); }
  }
  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>): void {
    const image = Array.from(event.clipboardData.files).find((file) => file.type.toLowerCase().startsWith("image/"));
    if (image) { event.preventDefault(); void attachImage(image); }
  }
  function onDrop(event: DragEvent<HTMLElement>): void {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    const image = Array.from(event.dataTransfer.files).find((file) => file.type.toLowerCase().startsWith("image/"));
    if (image) void attachImage(image); else setError("Drop an image file.");
  }
  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId);

  async function runCommand(command: string): Promise<void> {
    if (command === "/shell") {
      setDraft("/shell ");
      return;
    }
    setPending(true);
    try {
      await run(command);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Command failed.");
    } finally {
      setPending(false);
    }
  }

  async function submitDraft(): Promise<void> {
    const submitted = draft.trim();
    if (!canSend || submitted.length === 0) return;
    setPending(true);
    try {
      const submittedText = selectedSkill ? `${submitted}\n\n[Selected skill: ${selectedSkill.name}]\n${selectedSkill.instructions}` : submitted;
      await props.session.prompt(submittedText, attachment ? { type: "image", locator: attachment.locator, mediaType: attachment.mediaType } : undefined);
      setAttachment(undefined);
      setDraft("");
    } catch (caught) {
      // V2 prompt failures already live on session.error and render in ChatPane.
      // Keep composer-local errors for slash commands only, so one runtime
      // failure is not shown both above the transcript and below the composer.
      if (submitted.startsWith("/")) {
        setError(caught instanceof Error ? caught.message : "Composer command failed.");
      }
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
          <div className="a008-composer-tools">
            <details className="a008-composer-attach">
              <summary aria-label="More actions">+</summary>
              <button
                type="button"
                disabled={!connected || pending}
                onClick={() => {
                  const prompt = draft.trim();
                  if (prompt.length === 0) {
                    setError("Describe the image to generate.");
                    return;
                  }
                  setPending(true);
                  setError("");
                  void generateImage(prompt)
                    .then((image) => {
                      setNotice(`Generated image ${image.filename}\n${image.sha256}`);
                      setDraft("");
                    })
                    .catch((caught) => {
                      setError(caught instanceof Error ? caught.message : "Image generation failed.");
                    })
                    .finally(() => setPending(false));
                }}
              >
                Generate image
              </button>
            </details>
            <div className="a008-session-toolbar" aria-label="Session controls">
              <select
                aria-label="Session commands"
                value=""
                disabled={!connected || props.session.busy || pending}
                onChange={(event) => void runCommand(event.currentTarget.value)}
              >
                <option value="" disabled>Commands</option>
                <option value="/help">Help /help</option>
                <option value="/history">History /history</option>
                <option value="/model">Models /model</option>
                <option value="/status">Status /status</option>
                <option value="/cwd">Working directory /cwd</option>
                <option value="/tools">Tools /tools</option>
                <option value="/shell">Shell command /shell</option>
                <option value="/reset">Reset /reset</option>
                <option value="/undo">Undo /undo</option>
                <option value="/exit">End session /exit</option>
              </select>
              <button
                type="button"
                disabled={!connected || props.session.busy || pending}
                onClick={() => void runCommand("/undo")}
              >
                Undo
              </button>
              <button
                type="button"
                disabled={!connected || props.session.busy || pending}
                onClick={() => void runCommand("/reset")}
              >
                Reset
              </button>
            </div>
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
      {notice ? (
        <div className="a008-command-output">
          <button type="button" aria-label="Dismiss command output" onClick={() => setNotice("")}>
            ×
          </button>
          <pre className="a008-composer-notice" role="status">{notice}</pre>
        </div>
      ) : null}
    </section>
  );
}
