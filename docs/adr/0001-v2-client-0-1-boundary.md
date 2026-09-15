# ADR 0001 — Client 0.1 talks to implemented V2 only

Status: Accepted
Date: 2026-09-15
Task: ATC-0003

## Context

A008's [CLIENT_API_V2.md](file:///C:/code/a008/docs/CLIENT_API_V2.md) is an
accepted target, not a claim that every `/v2` row exists. Observed host state
on 2026-09-15 (A008-0112 complete, Stage 4 unstarted):

| Operation | Host status | 0.1 client |
| --- | --- | --- |
| `GET /v2/info` | Implemented, public | Used |
| `POST /v2/auth/ticket` | Implemented, device Bearer or PIN cookie | Used with device Bearer |
| `WS /v2/session` (`a008.v2`) | Implemented Stage 3 | Used |
| `session/new`, `inspect`, `prompt`, `cancel`, `control`, `tool/permission` | Implemented | Used |
| `session/resume`, command receipts, event `sequence` | Stage 4, not implemented | Not sent |
| `GET /v2/projects`, `/memory`, `/models`, upload, images, shell, catalog | Not implemented (`UNSUPPORTED_CAPABILITY`) | Not called |
| V1 HTTP (`/v1/models`, `/v1/projects`, …) | Implemented under the V1 PIN/engine gate | Best-effort **reads** of models and project list only |
| V1 `POST /v1/projects/open`, `/shell`, `/upload`, `GET /v1/memory` | Implemented, but bound to the host's global V1 workspace | Not called |

The A008 GUI under `C:\code\a008\gui` still speaks V1 WebSocket. This client
must not import that GUI or `@a008/protocol` from the source tree. The host
sends no CORS headers; a loopback `Origin` is allowed by the origin guard, but
a browser still needs same-origin access.

## Decision

1. Version 0.1 of this client is a V2 device client. Chat is the live product
   path. Memory, Tools, and Projects exist as the same navigation surfaces as
   the A008 GUI and tell the user which host operations are missing.
2. Wire types are owned here, copied from the observed A008 protocol schemas,
   and kept tolerant on inbound frames.
3. Development reaches the host through the Vite proxy (`/v2`, `/v1`,
   `/health` → `http://127.0.0.1:8787`). The renderer uses same-origin URLs
   by default.
4. Device secrets are stored in `localStorage` for 0.1 only. That is not the
   native secure store required by A008 ADR 0041.
5. `Allow all` for tools is a client-side auto-approve of later
   `tool/permission` signals. V2 itself only accepts a boolean allow/deny.

## Consequences

A running A008 host with a PIN cookie or device grant can chat from this
client. Memory inspection, terminal, upload, image generation, project
bootstrap, and reconnect/resume wait for later A008 V2 HTTP/Stage 4 or an
explicit later decision to add a V1 adapter with the correct ownership story.
Packaged Tauri HTTP uses a loopback-only Rust proxy (ATC-0007) instead of
host CORS. The session WebSocket still connects to the A008 loopback port.
