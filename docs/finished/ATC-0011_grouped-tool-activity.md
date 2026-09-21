# ATC-0011 — Group V2 tool activity and de-duplicate prompt errors

Task ID: ATC-0011
Parent Task: None
Status: Complete
Owner: ChatGPT / Grok
Created: 2026-09-16
Completed: 2026-09-21

## Outcome

V2 tool runs render with the A008 GUI grouped/status-coloured ToolActivity
presentation. `pending`/`in_progress` map to running and `completed`/`ok` to
success. Completed tools stay on the last assistant turn instead of a synthetic
live turn. Ordinary `session.prompt` failures render only on the session error
surface (ChatPane), not again under the composer.

## Verification

- Unit coverage for status/group presentation, `pending` → running, and
  completed-turn attachment.
- `npm test` — 45/45 passed (with ATC-0012).
- `npm run frontend:build` — passed.
- `git diff --check` — no whitespace errors; existing line-ending warnings only.
