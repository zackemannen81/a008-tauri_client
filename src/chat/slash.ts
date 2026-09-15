export const SLASH_HELP = `Composer commands:
  /help              Show this list.
  /exit, /quit, /q   End the session. The client stays open.
  /reset, /clear     Clear conversation turns. Saved memory remains.
  /undo              Drop the last committed user and assistant turn.
  /history           Show committed turns (no thought).
  /model             Show the current model.
  /model <id>        Switch model (starts a new conversation).
  /status            Model, session and project.
  /tools             List model tools from the session snapshot.

/shell, /cwd, upload and memory inspect are not on V2 HTTP yet.
Unknown /commands are not sent to the model.
`;

export type SlashName =
  | "help"
  | "exit"
  | "reset"
  | "undo"
  | "history"
  | "model"
  | "status"
  | "tools"
  | "shell"
  | "cwd";

export interface ParsedSlash {
  readonly name: SlashName;
  readonly argument: string;
}

const EXIT_NAMES = new Set(["exit", "quit", "q"]);
const RESET_NAMES = new Set(["reset", "clear"]);
const KNOWN = new Set<SlashName>([
  "undo",
  "history",
  "model",
  "status",
  "tools",
  "shell",
  "cwd",
]);

export function parseSlash(input: string): ParsedSlash | undefined {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return undefined;
  if (trimmed.startsWith("/!")) return { name: "shell", argument: trimmed.slice(2).trim() };
  const match = /^\/([A-Za-z][\w-]*)(?:\s+([\s\S]*))?$/u.exec(trimmed);
  if (match === null) throw new Error(`Unknown command: ${trimmed}. Type /help.`);
  const raw = match[1]!.toLowerCase();
  const argument = (match[2] ?? "").trim();
  if (raw === "help") return { name: "help", argument };
  if (EXIT_NAMES.has(raw)) return { name: "exit", argument };
  if (RESET_NAMES.has(raw)) return { name: "reset", argument };
  if (KNOWN.has(raw as SlashName)) return { name: raw as SlashName, argument };
  throw new Error(`Unknown command: /${raw}. Type /help.`);
}
