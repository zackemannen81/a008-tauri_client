# Current Status

Reality as of 2026-09-30. This document records observed state, not intended architecture.

## What exists

- The client repository is present at `C:\code\a008-tauri_client`.
- Client 0.1 Connect uses the owner PIN, then a scrollable
  `GET /v1/projects` list, then a cookie-backed V2 session.
- Packaged Tauri HTTP goes through a loopback-only Rust proxy so PIN/ticket
  calls are not CORS-blocked. Vite `frontend:dev` still uses the same-origin
  proxy. The session WebSocket still targets `ws://127.0.0.1:8787/v2/session`.
- Mutating V2 commands encode `commandId` (Stage 4 receipts). `session/new`
  still omits `payload.model`; real model ids are applied with `session/control`.
- Owner GUI surfaces now call the same V1 HTTP the bundled GUI uses for Memory,
  Terminal, Upload, Browser frame-check, Files listing, Provider/MCP, image
  generate, and `configureRuntime`. Zero Cost Radar is not ported.
- `npm test` passes 45 protocol/transcript/PIN/proxy/catalog/artifact/starfield/highlight/composer-parity/tool/v1-http tests.
- `npm run frontend:build` succeeds (449.20 kB main JS, 136.48 kB gzip).
- `C:\code\a008` was not modified.

## Current Work

`ATC-0011`, `ATC-0012` and `ATC-0013` are complete. No task is active. Next
identity is `ATC-0014`.

## Not Yet Established

- Live chat against a real device grant (no credential was created or stored
  during this task).
- Native secure credential storage (PIN cookie lives in the Tauri process).
- Project bootstrap/register UI; V2 reconnect-by-id remains the bind path.
- Composer file/path/paste image attach and in-session image turns.
- Automatic V2 `session/resume` after transport loss (capability is stored).
- Parameters → Zero Cost Radar (skipped by owner request).
- V2 HTTP for memory, projects admin, upload, images, shell, and catalog.
- Production custom-protocol CORS on the A008 host (not required; the client
  proxies loopback HTTP itself).

## Update Rule

Update this file when observed repository state, active work, blockers, or validation status changes. Keep planned behavior in `PROJECT_BRIEF.md` or task documents instead.
