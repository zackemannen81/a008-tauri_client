# ATC-0008 — GUI parity over stable contracts before Stage 4

Task ID: ATC-0008
Parent Task: ATC-0007
Status: Complete
Owner: Grok
Created: 2026-09-15
Completed: 2026-09-15

## Outcome

The A008 GUI at `C:\code\a008\gui` is the functional reference. Every
user-visible surface is inventoried in `docs/GUI_PARITY.md`. Features that
are local or already carried by implemented V2 session/control (including
`configure`) plus best-effort `GET /v1/models` are live in this client.

V1 routes that switch or inspect the host-global workspace are not called.
Those GUI functions remain waiting surfaces that name the missing V2 host
row. Host-global runtime preferences (`configureRuntime`) are not ported:
V2 snapshots omit `runtimePreferences` and the GUI meaning is all projects.

Stage 4 resume/idempotency was left untouched.

## Verification

- `npm test` — 27/27 passed.
- `npm run frontend:build` — passed (278.85 kB JS, 84.00 kB gzip).
- `C:\code\a008` unchanged.
