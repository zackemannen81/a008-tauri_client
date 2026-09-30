# System Document

Durable behavior that actually exists for `a008-tauri_client`.

## Current Runtime Boundary

The client is a Tauri 2 host with a Vite/React frontend. Version 0.1 presents
the A008 standalone GUI navigation (Chat, Memory, Tools, Help, Projects) and
speaks only the V2 operations the current A008 host implements.

## Implemented V2 contract

Observed against a running A008 host on 2026-09-16
(`serverVersion` `0.0.0`, features `auth.tickets` and `session.websocket`):

- `GET /v2/info` is public discovery.
- `POST /auth/login` with `{ pin }` issues the owner `a008_auth` cookie.
- `POST /v2/auth/ticket` accepts that cookie (browser-pin) or a device Bearer.
  The 0.1 Connect UI uses the PIN cookie and omits `Authorization`.
- `GET /v1/projects` under the PIN cookie lists registered projects for Connect.
- `WS /v2/session` uses subprotocol `a008.v2` and connects to the A008 host
  (`ws://127.0.0.1:8787/v2/session`) even when HTTP is same-origin through
  Vite. The first frame is `{ type: "authenticate", ticket }`. Commands are
  `session/new`, `session/inspect`, `session/prompt`, `session/cancel`,
  `session/control`, and `tool/permission`. `session/new` does not send
  `payload.model`; real model ids are applied with `session/control`.
  Mutating commands include `commandId`. `session/inspect` and
  `session/control { action: "inspect" }` do not.
- Other `/v2/*` HTTP paths are not implemented. Unauthenticated calls fail as
  `UNAUTHENTICATED`; authenticated unknown paths fail as
  `UNSUPPORTED_CAPABILITY`.

Thought streams are display-only and are cleared when a turn settles.
`Allow all` is a client-side auto-approve of later permission signals.
`session/control` `{ action: "configure" }` applies stream, sampling, reasoning
and token settings for the attached session. `{ action: "configureRuntime" }`
writes the host-global instructions/budgets/semantic settings the GUI uses.
V2 snapshots may omit `runtimePreferences`; the forms then start empty until
inspect/save returns them.

## Surfaces

- Connect unlocks with the owner PIN, then shows a scrollable project list.
- Chat is live over the V2 session after Connect. Empty chat has the local 4D
  starfield, start actions and the GUI shortcut dock. Fenced code is syntax-
  highlighted locally. Tool activity is grouped on the assistant turn. Header
  Canvas / Files / Workbench floats match the A008 GUI chrome.
- Composer exposes the GUI command selector plus Undo/Reset, `/shell` via
  `POST /v1/shell`, and Generate image via `POST /v1/images`. File/path/paste
  image attach is not ported.
- Code Canvas parses fenced HTML from answers, uses a local highlighted editor,
  and previews it locally (`srcDoc` + CSP). It does not call the host.
- Files lists tracked paths with `POST /v1/shell` `git ls-files`. Opening a
  path still sends a chat prompt.
- Tools is the GUI workbench: Terminal (`POST /v1/shell`), Files listing,
  Browser iframe plus `GET /v1/browser/frame-check`, Upload (`POST /v1/upload`).
- Memory Overview / Relationship map / Knowledge manager read `GET /v1/memory`
  against the host's current V1 workspace.
- Help is local (shortcuts and repository prompts).
- Projects may best-effort `GET /v1/projects` to list IDs when the V1 gate
  allows it. Selecting an ID reconnects the V2 socket; it does not `POST /v1/projects/open`.
- Parameters tabs: Model (configure + reset/undo/end), Semantic/Budgets/
  Instructions (`configureRuntime`), Provider catalog/keys, MCP, Runtime
  (`GET /v2/info`), Appearance (Neutral / Deep Space / Oldscool). Zero Cost
  Radar is not ported. Best-effort `GET /v1/models` supplies generation
  capabilities. Theme is renderer-local (`localStorage` `a008.preferences`).
  Shortcut dock visibility uses `a008.shortcutDock`.
- Device connection fields are stored in `localStorage`
  `a008.client.connection`. That is not a native secure store.
- The comparison matrix is `docs/GUI_PARITY.md`.

## Transport

`npm run frontend:dev` serves `http://127.0.0.1:1420` and proxies `/auth`,
`/v2`, `/v1`, and `/health` to `http://127.0.0.1:8787` (override with `A008_HOST`).
An empty host field uses the page origin in that Vite session.

In the Tauri webview the page origin is not the A008 host. HTTP then goes
through the Rust `proxy_http` command, which only reaches loopback `http(s)`
and stores `Set-Cookie` for later ticket/project calls. The session WebSocket
still connects to `ws://127.0.0.1:8787/v2/session` with subprotocol `a008.v2`.
The A008 host does not send CORS headers; the proxy exists so the webview does
not need them.

## Build Contract

- `npm test` runs Node tests for V2 frame handling, transcript/artifact behavior,
  local starfield/highlighting, composer parity, tool activity and V1 owner HTTP
  parsers.
- `npm run frontend:dev` serves the frontend at `http://127.0.0.1:1420`.
- `npm run frontend:build` typechecks and produces `dist/`.
- `npm run dev` and `npm run build` invoke the Tauri CLI and require the
  Rust/Tauri platform toolchain.

The A008 source repository at `C:\code\a008` remains a read-only reference.

## Documentation Authority

- `CURRENT_TASK.md` — the single active task charter.
- `CURRENT_STATUS.md` — observed repository and work state.
- `PROJECT_BRIEF.md` — product purpose and durable project boundaries.
- `SYSTEMDOC.md` — implemented system behavior and contracts.
- `FILESTRUCTURE.md` — authoritative map of important paths.
- `JOURNAL.md` — append-only decisions and milestones.
- `docs/adr/0001-v2-client-0-1-boundary.md` — 0.1 host/client boundary.
- `docs/adr/0003-gui-parity-before-stage-4.md` — transfer local/V2-stable GUI; do not emulate V1 global workspace.
- `docs/adr/0004-owner-v1-http-for-gui-surfaces.md` — owner PIN client may use GUI V1 HTTP where V2 business routes are missing; skip Zero Cost Radar.
- `docs/GUI_PARITY.md` — GUI feature matrix and missing V2 host rows.

## ATC-0013 additions

The desktop proxy also carries V1 file browsing/editing, project
preview/bootstrap/register, Skills, Zero Cost Radar and Platform V3 HTTP. Vite
proxies `/v3` as well. Platform V3 is conditional: `GET /v3/info` determines
whether its backend is enabled before the renderer exposes conversations/runs.
Its unavailable state performs no run request. File saves send the host-issued
SHA-256 revision. `docs/GUI_PARITY.md` is the current exhaustive parity record.
