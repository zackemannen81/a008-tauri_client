import { useEffect, useMemo, useRef, useState } from "react";
import { AsciiLogo } from "../brand/ascii-logo.js";
import type { ClientSession } from "../session/types.js";
import {
  buildChatTranscript,
  CHAT_CHANNEL,
  type ChatAssistantTurn,
  type ChatUserTurn,
} from "./chat-transcript.js";
import { StartActions } from "./start-actions.js";
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

function AssistantTurnView({ turn }: { readonly turn: ChatAssistantTurn }) {
  return (
    <article className="a008-chat-turn a008-chat-turn-assistant" data-a008-role="assistant">
      <span className="a008-chat-label">A008</span>
      <ThoughtBlock turn={turn} />
      {turn.tools && turn.tools.length > 0 ? (
        <details className="a008-tool-activity">
          <summary>
            Tools · {turn.tools.length}
          </summary>
          <ul>
            {turn.tools.map((tool) => (
              <li key={tool.id}>
                <strong>{tool.title}</strong> {tool.status}
                {tool.text ? <pre>{tool.text}</pre> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {turn.answer ? (
        <div className="a008-chat-bubble a008-chat-bubble-answer" data-a008-channel={CHAT_CHANNEL.answer}>
          {turn.answer}
        </div>
      ) : null}
    </article>
  );
}

export function ChatPane(props: {
  readonly session: ClientSession;
  readonly onStartPrompt: (prompt: string) => void;
}) {
  const transcript = useMemo(() => buildChatTranscript(props.session), [props.session]);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [transcript.turns.length, props.session.answer, props.session.thought]);

  return (
    <section className="a008-chat" aria-label="Conversation">
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
          <p>Connect with a V2 device credential, then send a prompt against the bound project.</p>
          <StartActions onPrompt={props.onStartPrompt} />
        </div>
      ) : (
        <div className="a008-chat-transcript" ref={scroller}>
          {transcript.turns.map((turn) =>
            turn.kind === "user" ? (
              <UserTurnView key={turn.id} turn={turn} />
            ) : (
              <AssistantTurnView key={turn.id} turn={turn} />
            ),
          )}
        </div>
      )}
    </section>
  );
}
