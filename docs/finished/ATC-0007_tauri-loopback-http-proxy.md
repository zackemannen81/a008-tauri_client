# ATC-0007 — Tauri loopback HTTP proxy for implemented V2

Task ID: ATC-0007
Parent Task: ATC-0003
Status: Complete
Owner: Grok
Created: 2026-09-15
Completed: 2026-09-15

## Outcome

The Tauri webview is not same-origin with A008, so browser `fetch` to
`http://127.0.0.1:8787` is CORS-blocked. Vite's proxy hid that in
`frontend:dev`. The Tauri host now has a loopback-only HTTP proxy that keeps
the PIN cookie and forwards `/v2/info`, `/v2/auth/ticket`, `/auth/login`, and
`/v1` reads. The session socket still talks `ws://127.0.0.1:8787/v2/session`
with `a008.v2`.

The V2 command set is still the implemented Stage-3 surface (no `commandId`,
no `session/resume`). `session/new` still omits `payload.model`.

## Verification

- `npm test` — 20/20 passed.
- `npm run frontend:build` — passed (247.54 kB JS, 75.42 kB gzip).
- `cargo check` in `src-tauri` — passed.
- `C:\code\A008` unchanged.
