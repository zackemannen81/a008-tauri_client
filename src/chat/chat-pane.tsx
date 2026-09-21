import { useEffect, useMemo, useRef, useState } from "react";
import {
  htmlArtifactFromAnswer,
  parseAssistantAnswer,
  type HtmlArtifactCandidate,
} from "../artifact/code-artifact.js";
import { AsciiLogo } from "../brand/ascii-logo.js";
import type { ClientSession } from "../session/types.js";
import {
  buildChatTranscript,
  CHAT_CHANNEL,
  type ChatAssistantTurn,
  type ChatUserTurn,
} from "./chat-transcript.js";
import { EmptyStarfield } from "./starfield.js";
import { StartActions } from "./start-actions.js";
import { HighlightedCode } from "../highlight/highlighted-code.js";
import { ToolActivity } from "./tool-activity.js";
import "./chat-pane.css";

function ThoughtBlock({ turn }: { readonly turn: ChatAssistantTurn }) {
  const [open, setOpen] = useState(false);
  if (turn.thought === "") return null;
  return (
    <details
      className="a008-chat-thought"
      data-a008-channel={CHAT_CHANNEL.thought}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary aria-label="Thought, display only. Not part of the answer.">Thought</summary>
      <div className="a008-chat-thought-body">{turn.thought}</div>
    </details>
  );
}

function UserTurnView({ turn }: { readonly turn: ChatUserTurn }) {
  return (
    <article className="a008-chat-turn a008-chat-turn-user" data-a008-role="user">
      <span className="a008-chat-label">You</span>
      <p className="a008-chat-bubble a008-chat-bubble-user" data-a008-channel={CHAT_CHANNEL.user}>
        {turn.text}
      </p>
    </article>
  );
}

function AssistantTurnView(props: {
  readonly turn: ChatAssistantTurn;
  readonly onArtifactOpen?: (artifact: HtmlArtifactCandidate) => void;
}) {
  const { turn } = props;
  const segments = parseAssistantAnswer(turn.answer);
  return (
    <article className="a008-chat-turn a008-chat-turn-assistant" data-a008-role="assistant">
      <span className="a008-chat-label">A008</span>
      <ThoughtBlock turn={turn} />
      <ToolActivity tools={turn.tools} />
      {turn.answer ? (
        <div
          className="a008-chat-bubble a008-chat-bubble-answer"
          data-a008-channel={CHAT_CHANNEL.answer}
        >
          {segments.map((segment, index) =>
            segment.kind === "text" ? (
              <span key={`text-${String(index)}`} className="a008-chat-answer-text">
                {segment.text}
              </span>
            ) : (
              <figure key={`code-${String(index)}`} className="a008-chat-code">
                <figcaption className="a008-chat-code-head">
                  <span>{segment.language || "code"}</span>
                  {!turn.live && segment.artifactEligible && props.onArtifactOpen ? (
                    <button
                      type="button"
                      onClick={() =>
                        props.onArtifactOpen?.({
                          sourceTurnId: turn.id,
                          language: "html",
                          source: segment.code,
                          bytes: new TextEncoder().encode(segment.code).byteLength,
                        })
                      }
                    >
                      Open in Canvas
                    </button>
                  ) : segment.oversized ? (
                    <span>Too large for Canvas</span>
                  ) : null}
                </figcaption>
                <HighlightedCode code={segment.code} language={segment.language} />
              </figure>
            ),
          )}
        </div>
      ) : null}
      {turn.live ? (
        <span className="a008-chat-live" aria-live="polite">
          {turn.answer === "" ? "Thinking…" : "Writing…"}
        </span>
      ) : null}
    </article>
  );
}

export function ChatPane(props: {
  readonly session: ClientSession;
  readonly onStartPrompt: (prompt: string) => void;
  readonly onArtifactOpen?: (artifact: HtmlArtifactCandidate) => void;
  readonly onArtifactCandidate?: (artifact: HtmlArtifactCandidate) => void;
}) {
  const transcript = useMemo(() => buildChatTranscript(props.session), [props.session]);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [transcript.turns.length, props.session.answer, props.session.thought]);

  const latestArtifact = useMemo(() => {
    for (let index = transcript.turns.length - 1; index >= 0; index -= 1) {
      const turn = transcript.turns[index];
      if (turn?.kind !== "assistant" || turn.live) continue;
      const artifact = htmlArtifactFromAnswer(turn.answer, turn.id);
      if (artifact !== undefined) return artifact;
    }
    return undefined;
  }, [transcript.turns]);
  const reportedArtifact = useRef("");
  useEffect(() => {
    if (!latestArtifact || !props.onArtifactCandidate) return;
    const key = `${latestArtifact.sourceTurnId}:${String(latestArtifact.bytes)}:${latestArtifact.source}`;
    if (reportedArtifact.current === key) return;
    reportedArtifact.current = key;
    props.onArtifactCandidate(latestArtifact);
  }, [latestArtifact, props.onArtifactCandidate]);

  return (
    <section className="a008-chat" aria-label="Conversation">
      {transcript.empty ? <EmptyStarfield /> : null}
      {props.session.error ? (
        <p className="a008-chat-error" role="alert">
          {props.session.error}
        </p>
      ) : null}
      {transcript.empty ? (
        <div className="a008-chat-empty">
          <AsciiLogo />
          <hr className="a008-empty-rule" />
          <h1>What should we work on?</h1>
          <p>Unlock with the owner PIN, choose a project, then send a prompt.</p>
          <StartActions onPrompt={props.onStartPrompt} />
        </div>
      ) : (
        <div className="a008-chat-transcript" ref={scroller}>
          {transcript.turns.map((turn) =>
            turn.kind === "user" ? (
              <UserTurnView key={turn.id} turn={turn} />
            ) : (
              <AssistantTurnView
                key={turn.id}
                turn={turn}
                onArtifactOpen={props.onArtifactOpen}
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}
