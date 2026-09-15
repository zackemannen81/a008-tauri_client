# Current Status

Reality as of 2026-09-15. This document records observed state, not intended architecture.

## What exists

- The client repository is present at `C:\code\a008-tauri_client`.
- Client 0.1 Connect uses the owner PIN, then a scrollable
  `GET /v1/projects` list, then a cookie-backed V2 session.
- Packaged Tauri HTTP goes through a loopback-only Rust proxy so PIN/ticket
  calls are not CORS-blocked. Vite `frontend:dev` still uses the same-origin
  proxy. The session WebSocket still targets `ws://127.0.0.1:8787/v2/session`.
- `npm test` passes 20 protocol/transcript/PIN/proxy tests.
- `npm run frontend:build` succeeds (247.54 kB main JS, 75.42 kB gzip).
- `cargo check` for the Tauri host passes.
- A running A008 host on `http://127.0.0.1:8787` answered `GET /v2/info` with
  `protocol: a008.v2`, features `auth.tickets` and `session.websocket`, and
  auth profiles `device` and `browser-pin`. The Vite proxy on
  `http://127.0.0.1:1420/v2/info` returned the same document.
- Unauthenticated `POST /v2/auth/ticket` returned `UNAUTHENTICATED`.
- `C:\code\a008` was not modified.

## Current Work

`ATC-0007` is complete. Tauri HTTP uses the loopback proxy; V2 chat still uses
the implemented Stage-3 socket.

## Not Yet Established

- Live chat against a real device grant (no credential was created or stored
  during this task).
- Native secure credential storage (PIN cookie lives in the Tauri process).
- Production custom-protocol CORS on the A008 host (not required; the client
  proxies loopback HTTP itself).
- V2 HTTP for memory, projects admin, upload, images, shell, and catalog.
- V2 Stage 4 resume/idempotency.

## Update Rule

Update this file when observed repository state, active work, blockers, or validation status changes. Keep planned behavior in `PROJECT_BRIEF.md` or task documents instead.
