# ATC-0009 — Close remaining local GUI parity before Stage 4

Task ID: ATC-0009
Parent Task: ATC-0008
Status: Complete
Owner: ChatGPT
Created: 2026-09-16
Completed: 2026-09-16

## Outcome

The remaining renderer-local parity work from the A008 GUI reference is now in
the Tauri client: the empty-chat 4D starfield, bounded highlight.js fenced-code
rendering, highlighted Code Canvas editing, and the composer command selector
with Undo/Reset shortcuts.

No new host contract was invented. Shell, cwd and image actions remain honest
waiting behavior until their project-scoped V2 operations exist. The client
continues to avoid V1 global-workspace mutation routes.
## Verification

- `npm test` — 38/38 passed.
- `npm run frontend:build` — passed; main JS 383.52 kB, 117.42 kB gzip.
- `git diff --check` — no whitespace errors; only existing line-ending warnings.
- Source audit — executable V1 calls are only the documented best-effort
  `GET /v1/projects` and `GET /v1/models`; no `session/resume` or `resumeToken`;
  encoded commands still omit `commandId`.
- Live `GET http://127.0.0.1:8787/v2/info` — `a008.v2`, `auth.tickets`,
  `session.websocket`.
- `cargo check` was not rerun because Cargo is unavailable on PATH in this shell.
- `C:\code\a008` remained unchanged and clean.

## Handoff

A008's Stage 3.5 GO is already recorded upstream. Stage 4 owns application
turn/message identity, snapshot/event ordering, terminal outcomes, command
receipts/idempotency and reconnect/resume. This client is ready to consume that
contract when A008 implements it; it does not pre-freeze those semantics.
