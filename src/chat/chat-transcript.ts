import type { ClientSession, ToolCall } from "../session/types.js";

export const CHAT_CHANNEL = {
  user: "user",
  thought: "thought",
  answer: "answer",
} as const;

export interface ChatUserTurn {
  readonly kind: "user";
  readonly id: string;
  readonly text: string;
}

export interface ChatAssistantTurn {
  readonly kind: "assistant";
  readonly id: string;
  readonly thought: string;
  readonly answer: string;
  readonly live: boolean;
  readonly tools?: readonly ToolCall[];
}

export type ChatTurn = ChatUserTurn | ChatAssistantTurn;

export interface ChatTranscript {
  readonly empty: boolean;
  readonly turns: readonly ChatTurn[];
}

export function buildChatTranscript(session: ClientSession): ChatTranscript {
  const turns: ChatTurn[] = [];
  const messages = session.details?.messages ?? [];
  messages.forEach((message, index) => {
    if (message.role === "user") {
      turns.push({ kind: "user", id: `user-${String(index)}`, text: message.content });
      return;
    }
    turns.push({
      kind: "assistant",
      id: `assistant-${String(index)}`,
      thought: "",
      answer: message.content,
      live: false,
    });
  });

  const last = turns.at(-1);
  const pendingIsNew =
    session.pendingText !== undefined &&
    (last?.kind !== "user" || last.text !== session.pendingText);
  if (pendingIsNew && session.pendingText) {
    turns.push({ kind: "user", id: "pending-user", text: session.pendingText });
  }

  const hasLiveAssistant = session.busy || session.thought !== "" || session.answer !== "";
  if (hasLiveAssistant) {
    turns.push({
      kind: "assistant",
      id: "live-assistant",
      thought: session.thought,
      answer: session.answer,
      live: true,
      ...(session.tools.length > 0 ? { tools: session.tools } : {}),
    });
  } else if (session.tools.length > 0) {
    let assistantIndex = -1;
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      if (turns[index]?.kind === "assistant") {
        assistantIndex = index;
        break;
      }
    }
    if (assistantIndex >= 0) {
      const assistant = turns[assistantIndex];
      if (assistant?.kind === "assistant") {
        turns[assistantIndex] = { ...assistant, tools: session.tools };
      }
    } else {
      turns.push({ kind: "assistant", id: "tool-assistant", thought: "", answer: "", live: false, tools: session.tools });
    }
  }

  return { empty: turns.length === 0, turns };
}
