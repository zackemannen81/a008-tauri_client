# Current Task

Task ID: ATC-0003
Parent Task: ATC-0002
Status: Complete
Owner: Rickard
Created: 2026-09-15
Last updated: 2026-09-15
Charter frozen at: 2026-09-15
Completed: 2026-09-15

## Task Summary

Build client version 0.1: the A008 GUI navigation surfaces in this Tauri
repository, talking only to host operations that exist in the current A008
implementation. A008 remains read-only.

## Task Charter

### Goal

Ship a usable desktop-client 0.1 that can authenticate as a V2 device, open a
chat session, and present the standalone GUI pages, without claiming host
capabilities that are still unimplemented.

### Primary Deliverable

A Vite/React frontend in this repository that:

- Speaks the implemented V2 surface (`GET /v2/info`, `POST /v2/auth/ticket`,
  `WS /v2/session` with `a008.v2`).
- Renders Chat, Memory, Tools, Help, and Projects using the A008 GUI chrome.
- Makes Chat live over V2 session commands.
- Keeps Memory, Tools, and Projects honest about missing V2 HTTP.

### In Scope

- Claim `ATC-0003` and record the observed host/client boundary.
- Replace the readiness screen with the 0.1 workspace shell.
- Implement a local V2 HTTP/WebSocket adapter (no A008 source imports).
- Device-credential connect flow, session prompt/cancel/control, tool
  permission, and composer slash commands that V2 can honour.
- Theme tokens and layout taken from `C:\code\a008\gui` as visual reference.
- Best-effort read of `GET /v1/projects` and `GET /v1/models` when the V1 gate
  allows it; never call V1 workspace switch, shell, upload, or memory inspect.
- Frontend build and protocol unit tests.

### Out of Scope

- Modifying `C:\code\a008`.
- V2 Stage 4 (resume lease, command idempotency, snapshot/event race).
- V2 HTTP that the host currently answers as `UNSUPPORTED_CAPABILITY`
  (projects, memory, upload, images, shell, catalog, provider-settings).
- Wiring Memory/Tools to V1 routes (wrong owner: V1 is the host global
  workspace, not the V2 project binding).
- Tauri secure storage, Rust HTTP proxy, packaging, or a full GUI port of
  Code Canvas, starfield, catalog, or image generation.
- Live-provider proof.

### Definition of Done

- Chat can connect with a device ticket and exchange V2 session frames.
- The five GUI pages exist and unavailable V2 HTTP surfaces say so.
- `npm run frontend:build` succeeds.
- Protocol encode/decode tests pass.
- Control-plane docs record the observed 0.1 contract.

### Minimum Verification Gates

- [x] Protocol unit tests for V2 ticket/session frame handling.
- [x] `npm run frontend:build`.
- [x] No writes under `C:\code\a008`.

## References

- `C:\code\a008\docs\CLIENT_API_V2.md` (accepted target, not current inventory)
- `C:\code\a008\docs\CLIENT_AUTH.md` (implemented V2 auth/session)
- `C:\code\a008\docs\CURRENT_STATUS.md` (A008-0112 Stage 3 complete; Stage 4 not)
- `C:\code\a008\gui\src` (visual/navigation surfaces)
- `docs/adr/0001-v2-client-0-1-boundary.md`

## Checklist

- [x] Break work into ordered steps and keep them truthful.
- [x] Implement V2 adapter, shell, and pages.
- [x] Include verification and documentation updates.

## Decisions and Notes

- Follow the implemented V2 wire (`packages/protocol` `v2-auth.ts` /
  `v2-session.ts`), not the still-unbuilt rows in CLIENT_API_V2.md.
- Mutating V2 commands currently have no `commandId`; do not send one
  (schemas are `.strict()`).
- Browser CORS: the A008 host sends no CORS headers. Development uses the
  Vite proxy so the renderer stays same-origin. Production Tauri custom-
  protocol access needs a later Rust proxy or a named origin plus CORS on
  the host (host change is out of scope).

## Charter Amendment Log

- none

## Verification

- [x] Review actual changes against the necessity arguments and frozen scope.
- [x] Record exact checks and outputs.
- [x] Record skipped checks and reasons.

Checks:

- `npm test` — 12/12 passed.
- `npm run frontend:build` — typecheck + Vite production build passed
  (244.36 kB main JS, 74.43 kB gzip).
- Live host `GET http://127.0.0.1:8787/v2/info` returned `a008.v2` with
  features `auth.tickets` and `session.websocket`.
- Vite proxy `GET http://127.0.0.1:1420/v2/info` returned the same document.
- Unauthenticated `POST /v2/auth/ticket` returned `UNAUTHENTICATED`.
- `git -C C:\code\a008 status --short` was empty.

Skipped:

- Live device grant and a real `session/prompt` (no credential created).
- Interactive browser click-through (no browser automation in this environment).
- Tauri/`cargo` build (Rust toolchain not used in this slice).

## Documentation Updates

- [x] `docs/CURRENT_STATUS.md`
- [x] `docs/SYSTEMDOC.md`
- [x] `docs/JOURNAL.md`
- [x] `docs/FILESTRUCTURE.md` when structure changes
- [x] ADRs and collection indexes when needed

## Handoff and Follow-ups

- Current state: client 0.1 frontend is built and the V2 adapter is tested
  against recorded frames plus live `/v2/info`.
- Next recommended step: grant a device credential on the running A008 host
  and prove one chat turn from Connect. After that, a Rust proxy + secure
  store for production Tauri.
- Blockers: none for 0.1 frontend. Native packaging still needs Rust.
- Child tasks: none
- Resume condition: n/a
- Open questions: production native transport (Rust proxy vs host CORS).
