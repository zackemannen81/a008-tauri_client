# GUI parity matrix

Status: Observed against `C:\code\a008\gui` and this client on 2026-09-21
(ATC-0012). The A008 GUI remains the functional reference. This client must
not import it. Zero Cost Radar is skipped by owner request.

Flags in **Tauri status**:

- **Live** — implemented here on a stable contract.
- **Local** — renderer-only; no host call.
- **Waiting** — surface exists and tells the user which V2 host operation is missing.
- **Not ported** — GUI behavior is not in this client.

**Owner** is the GUI module that currently implements the feature.
**Host/API** is what that GUI actually calls today.

Implemented V2 on the running host: `GET /v2/info`, `POST /auth/login`,
`POST /v2/auth/ticket`, `WS /v2/session` actions `session/new`, `inspect`,
`prompt`, `cancel`, `control`, `tool/permission` (mutations carry `commandId`).
Owner V1 HTTP used by this PIN client (ADR 0004): `GET /v1/projects`,
`GET /v1/models`, `GET /v1/memory`, `POST /v1/shell`, `POST /v1/upload`,
`POST /v1/images`, `GET /v1/browser/frame-check`, `GET/POST /v1/mcp-servers`,
`GET/POST /v1/provider-settings`, `GET/POST /v1/catalog/nvidia`,
`GET /v1/catalog/kie`.

## Matrix

| GUI feature | Owner | Host/API | Tauri status | Blocker |
| --- | --- | --- | --- | --- |
| Rail: Chat, Memory, Tools, Help, Projects | `gui/src/app.tsx` | local | Live | — |
| Hamburger / narrow nav | `app.tsx` | local | Live | — |
| Connection status | `app.tsx` | session state | Live | — |
| Workspace name | `app.tsx` | V1 snapshot `runtime.cwd` | Live (project name/id) | V2 snapshots omit `runtime.cwd` |
| Runtime details pane | `settings/settings-pane.tsx` | V1 snapshot cwd/memory | Live (model/session/project) | V2 omits cwd, memory path |
| Parameters dialog | `settings/parameters-panel.tsx` | mixed | Live (no Zero Cost tab) | Radar skipped |
| PIN unlock | host login page / cookie | `POST /auth/login` | Live (Connect) | — |
| Project list after unlock | `projects/bootstrap-client.ts` | `GET /v1/projects` | Live | `GET /v2/projects` not implemented |
| Open registered project | `projects-page.tsx` | `POST /v1/projects/open` | Live as V2 reconnect by id | Must not call V1 open |
| New project / preview / bootstrap | `projects-page.tsx` | `POST /v1/projects/preview`, `/bootstrap` | Waiting | Not in ATC-0012 |
| Add existing / register | `projects-page.tsx` | `POST /v1/projects/register` | Waiting | Not in ATC-0012 |
| Browse host filesystem | `bootstrap-client.ts` | `GET /v1/projects/browse` | Waiting | Not in ATC-0012 |
| Chat transcript, thought, Stop | `chat/chat-pane.tsx` | V1 WS `prompt`/`cancel` | Live on V2 session | — |
| Tool activity grouped | `tools/repository-pane.tsx` | WS `tool` | Live | — |
| Start-action prompts | `chat/start-actions.tsx` | `session.prompt` | Live | — |
| Empty ASCII logo | `brand/ascii-logo.tsx` | local | Live | — |
| Starfield | `chat/starfield.tsx` | local | Local | — |
| Shortcut dock + hide/show | `chat/empty-shortcuts.tsx` | `localStorage` `a008.shortcutDock` | Live | — |
| Ctrl+Shift+G review | `app.tsx` | `session.prompt` | Live | — |
| Ctrl+` / Ctrl+T / Ctrl+P / Ctrl+Alt+S | `app.tsx` | local nav | Live | — |
| Composer send / newline | `composer/composer.tsx` | WS prompt | Live | — |
| Slash `/help` `/exit` `/reset` `/undo` `/history` `/model` `/status` `/tools` | `composer/slash.ts` | local + `session/control` | Live | — |
| Slash `/shell` `/!` `/cwd` | `submit.ts` | `POST /v1/shell` | Live | Runs in host process cwd |
| Tool permission + Allow all | `session/tool-permission-dialog.tsx` | WS `tool/permission` | Live | Allow-all is client-side |
| Session reset / undo / close / model | `session-controls` | WS `session/control` | Live | — |
| Session **configure** | `parameters-panel.tsx` | WS `{action:"configure"}` | Live | — |
| Session **configureRuntime** | `global-settings-form.tsx` | WS `{action:"configureRuntime"}` | Live | V2 snapshots may omit current values |
| Appearance Neutral / Deep Space / Oldscool | `appearance-panel.tsx` | `localStorage` `a008.preferences` | Live | — |
| Provider keys / catalog add-remove | `nvidia-catalog-panel.tsx` | `/v1/provider-settings`, `/v1/catalog/*` | Live | Host-global admin |
| MCP servers | `mcp-servers-panel.tsx` | `GET/POST /v1/mcp-servers` | Live | Applies to later sessions |
| Zero Cost Radar | `zero-cost-radar-panel.tsx` | `GET /v1/catalog/zero-cost` | Not ported | Owner skip |
| Runtime Stage 4 | `runtime-capabilities-panel.tsx` | `GET /v2/info` | Live | — |
| Code fence parse + Open in Canvas | `artifact/code-artifact.ts` | local | Local | — |
| Code Canvas preview/edit/revert | `artifact/code-artifact-panel.tsx` | local `srcDoc` iframe | Live | — |
| Chat Files float | `files/files-pane.tsx` | `POST /v1/shell` `git ls-files` | Live | Host cwd listing |
| Chat Workbench float | `workbench/environment-panel.tsx` | prompts + `git status` | Live | — |
| Workbench Sources upload | `environment-panel.tsx` | Tools → Upload | Live (delegates) | Composer clipboard ingest not ported |
| Tools → Terminal | `terminal/terminal-pane.tsx` | `POST /v1/shell` | Live | Host process cwd |
| Tools → Files | `files/files-pane.tsx` | V1 shell `git ls-files` | Live | — |
| Tools → Browser | `browser/browser-pane.tsx` | `GET /v1/browser/frame-check` + iframe | Live | — |
| Tools → Upload | `upload/upload-pane.tsx` | `POST /v1/upload` | Live | Host source store |
| Image generate in composer | `images/generate-image.ts` | `POST /v1/images` | Live | No in-session image turns |
| Image attach file/path/paste | `composer/composer.tsx` | `POST /v1/upload` + V1 prompt attachment | Not ported | V2 prompt is text-only |
| Memory Overview / graph / manager | `memory/*` | `GET /v1/memory` | Live | Current V1 workspace, not V2 project id |
| Help shortcuts | `help/help-page.tsx` | local | Live | — |
| Help Repository actions | `tools/repository-pane.tsx` | `session.prompt` | Live | — |
| Engine `#engine=` embed token | `session/engine-access.ts` | V1 panel access | Not ported | Desktop client uses PIN/ticket |
| V2 `session/resume` | `@a008/client` V2 adapter | Stage 4 resume capability | Waiting | Capability stored; reconnect path not wired |

## Missing V2 host functionality

These remain the target V2 rows. ATC-0012 uses GUI V1 owner HTTP instead of
waiting chrome, except where noted.

| Needed V2 capability | Why V1 is the wrong long-term owner |
| --- | --- |
| `GET /v2/projects` | V1 list is a PIN-gated registry read, not the V2 grant model |
| `POST /v2/projects/browse`, `/preview`, `/bootstrap`, register | V1 bootstrap/register/open replace the host’s global workspace |
| `GET /v2/projects/{id}/memory` | `GET /v1/memory` inspects the current V1 bridge namespace |
| `POST /v2/projects/{id}/upload` and source listing | `POST /v1/upload` ingests into the V1 workspace source store |
| `POST /v2/projects/{id}/images` + blob GET | `POST /v1/images` writes that same host store |
| `POST /v2/projects/{id}/shell` | `POST /v1/shell` runs in the host process cwd |
| Project cwd / memory path on V2 session snapshots | V2 `state` is strict: no `runtime.cwd`, no `memoryPath` |
| `GET/POST /v2/catalog/*`, `/v2/provider-settings` | Host-global provider admin; no V2 HTTP |
| `GET /v2/browser/frame-check` | Host origin probe; no V2 route |
| `GET /v2/models` | `GET /v1/models` is used best-effort |

## Transfer rule (ATC-0012 / ADR 0004)

Copy renderer logic from the GUI. Chat stays on V2. Owner HTTP the GUI uses
may be called from this PIN client until project-scoped V2 routes exist. Do
not import `C:\code\a008\gui`. Skip Zero Cost Radar.
