# Journal

Newest first. Append only.

## 2026-09-21 — ATC-0012 — GUI owner surface lift except Zero Cost Radar

- Closed ATC-0011: grouped V2 tool activity on the correct assistant turn;
  ordinary prompt failures stay on ChatPane only.
- Mutating V2 commands now encode Stage-4 `commandId`.
- Ported remaining GUI owner surfaces except Zero Cost Radar: Memory inspect
  UI, Terminal, Upload, Browser frame-check, Files git listing, Provider, MCP,
  Runtime (`GET /v2/info`), Semantic/Budgets/Instructions (`configureRuntime`),
  Oldscool theme, composer `/shell` and Generate image.
- ADR 0004: owner PIN desktop client may use the GUI's V1 owner HTTP where V2
  business routes still do not exist. Project bind remains V2 reconnect-by-id.
- Verification: 45/45 tests; `frontend:build` passes (449.20 kB JS, 136.48 kB
  gzip); `git diff --check` clean apart from line-ending warnings.
- `C:\code\a008` remained read-only.

## 2026-09-16 - ATC-0010 - Remove duplicate empty-chat shortcuts

- Removed the duplicate centre shortcut list from the empty conversation view.
- Kept the persistent ShortcutDock and keyboard shortcuts unchanged.
- Verification: 38/38 tests; `frontend:build` passes.

## 2026-09-16 â€” ATC-0009 â€” Stage-4 client readiness

- Closed the remaining renderer-local GUI parity gaps left after ATC-0008:
  4D empty-chat starfield, highlight.js fenced-code rendering, highlighted Code
  Canvas editing, and composer command selector plus Undo/Reset controls.
- Unsupported shell/cwd/image behavior remains explicit waiting UI; no V1
  workspace mutation was introduced. Executable V1 calls remain the approved
  best-effort `GET /v1/projects` and `GET /v1/models` reads.
- Source audit found no `session/resume` or `resumeToken`; `commandId` remains
  absent from encoded commands. Stage 4 semantics are left to A008.
- Verification: 38/38 tests; `frontend:build` passes (383.52 kB JS, 117.42 kB
  gzip); `git diff --check` clean apart from line-ending warnings; live
  `GET /v2/info` reports `a008.v2` with ticket + WebSocket features.
- `cargo` is not available on PATH in this shell, so Rust check was not rerun.
  `C:\code\a008` remained clean and read-only.

## 2026-09-15 — ATC-0008 — GUI parity before Stage 4

- Inventoried every user-visible A008 GUI surface against this client.
- Matrix: `docs/GUI_PARITY.md`. ADR 0003: transfer local + implemented V2;
  do not emulate V1 global workspace.
- Transferred: shortcut dock/keys, Code Canvas, Files/Workbench floats,
  Tools workbench (Browser iframe, prompt Files), Model `configure`, Help
  repository prompts, Memory tab chrome, runtime details.
- Not ported: memory inspect, shell, upload, images, project
  bootstrap/register/open, catalog, host-global instructions/budgets,
  starfield, highlight.js.
- Verification: 27/27 tests; `frontend:build` passes; `C:\code\a008` unchanged.

## 2026-09-15 — ATC-0007 — Tauri HTTP proxy for implemented V2

- Packaged Tauri `fetch` to `:8787` is CORS-blocked. Vite same-origin proxy hid it.
- Added loopback-only `proxy_http` in the Tauri host with a process cookie jar.
- Frontend uses that fetch in Tauri; Vite still uses ordinary `fetch`.
- V2 wire unchanged: Stage-3 commands, no `commandId`, `session/new` omits model.

## 2026-09-15 — ATC-0006 — Open session rejected real model ids

- `session/new` payload.model is a V2 id (`[A-Za-z0-9_-]+`). Sending `gpt-5.6-luna` or `nvidia/…` made the host reject Open session.
- Create the session without a model, then apply the selected model with `session/control`.
- Same-origin HTTP still uses the Vite proxy (PIN cookie). The session WebSocket goes to `ws://127.0.0.1:8787/v2/session` so the `a008.v2` subprotocol is not stripped.

## 2026-09-15 — ATC-0005 — App icon and ACME-engine mark

- Replaced the drawn A-mark in the left navigation with the Tauri app icon (`src-tauri/icons/128x128@2x.png` served as `/app-icon.png`).
- Placed `acme-engine_certified.png` in the sidebar footer at 8.25rem wide.
- Favicon uses the same app icon.

## 2026-09-15 — ATC-0004 — Owner PIN login and project list

- Connect now uses the same six-digit PIN as the A008 GUI (`POST /auth/login`).
- After unlock, `GET /v1/projects` fills a scrollable list (name + root). No device grant and no pasted UUID.
- Cookie-backed V2 tickets omit `Authorization` so the host can use the browser-pin profile.
- Vite proxies `/auth` in addition to `/v1` and `/v2`. PIN is not stored.
- Verification: 16/16 tests; `frontend:build` passes; proxied `GET /v1/projects` returned PIN `401 Authentication required.` Live PIN unlock was not completed because the host later stopped accepting connections.

## 2026-09-15 — ATC-0003 — Client 0.1 over implemented V2

- Claimed `ATC-0003` and accepted ADR 0001: talk only to host operations that exist (V2 info/ticket/session). Do not call V1 workspace switch, shell, upload, or memory inspect.
- Replaced the readiness screen with the A008 GUI chrome: Chat, Memory, Tools, Help, Projects.
- Chat uses a local V2 adapter (`GET /v2/info`, `POST /v2/auth/ticket`, `WS /v2/session` / `a008.v2`).
- Memory/Tools/Projects are present as honest waiting surfaces. Help is local.
- Verification: 12/12 tests pass; `npm run frontend:build` passes; live `GET /v2/info` through the Vite proxy matches the running A008 host; `C:\code\a008` unchanged. No device grant or live prompt was performed.
- Rust/Tauri compilation remains unverified in this environment.

## 2026-09-15 — ATC-0002 — Minimal Tauri base verified

- Confirmed `npm install` and `npm run frontend:build` complete successfully.
- Confirmed the full Tauri build remains blocked by the unavailable Rust/Cargo toolchain in this environment.

## 2026-09-15 — ATC-0002 — Minimal Tauri base implemented

- Added the Tauri 2 Rust host under `src-tauri/` and connected it to a Vite frontend.
- Added the minimal readiness screen, npm scripts, configuration, and setup documentation.
- Confirmed Node.js/npm are available; Rust is not installed in the current environment, so Tauri compilation remains unverified locally.
- Kept `C:\\code\\a008` unchanged and read-only.

## 2026-09-15 — ATC-0002 — Tauri base chartered

- Closed the repository bootstrap task `ATC-0001`.
- Claimed `ATC-0002` for implementation of the minimal Tauri application base.
- Kept transport, authentication, production UI, and release automation out of scope.


## 2026-09-15 — ATC-0001 — Client bootstrap

- Confirmed the writable project repository is `C:\code\a008-tauri_client`.
- Established `C:\code\a008` as a read-only source/reference repository.
- Initialized the docs-first continuity protocol and registered `ATC-0001`.
- No Tauri runtime or integration contract was frozen by this bootstrap.

## Bootstrap

- Created by A008 project bootstrap.
