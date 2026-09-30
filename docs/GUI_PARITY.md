# GUI parity matrix

Status: Observed against the clean A008 GUI checkout `C:\code\a008\gui` at
A008 revision `4ab38e5` (`Prevent replay of confirmed GUI permission
decisions`, 2026-09-30), and this client repository, on 2026-09-30 (ATC-0013).
The GUI remains the functional reference. The Tauri client is an independent
implementation and must not import the GUI. The owner-requested Parameters →
Zero Cost Radar panel remains intentionally unported. This is a code/contract
inventory; a host endpoint's source implementation is not proof that the
operator's running host supports it or that a live session was exercised.

## Status vocabulary

- **Live** — corresponding client behavior exists on an applicable client/host contract.
- **Partial** — surface or subset exists; material GUI behavior remains absent.
- **Waiting** — a waiting/placeholder surface explains that the host/API is missing.
- **Local** — renderer-local behavior with no host call.
- **Not ported** — no corresponding client surface/behavior exists.
- **Policy exclusion** — deliberately omitted by owner request, not an API blocker.

| GUI feature / view | GUI owner | GUI host/API and action | Tauri status | Gap, qualification or blocker |
| --- | --- | --- | --- | --- |
| Main app / page shell | `gui/src/app.tsx` | Local React shell | Partial | Chat, Memory, Tools, Help, Projects and shortcut navigation exist; Platform V3 page is absent. GUI also has application menus, project sidebar and branch/context affordances. |
| Chat / transcript / start actions | `gui/src/chat/chat-pane.tsx`, `chat/start-actions.tsx` | Standalone durable `/v1/chat/v3/*`; legacy V1 session adapter remains selectable | Partial | Tauri live chat uses `/v2/session` ticket/WebSocket. Transcript and start actions exist, but are not durable-project conversation/run API parity. |
| Durable project chat, conversations and run recovery | `gui/src/session/durable-chat-client.ts`, `use-durable-chat.ts` | `/v1/chat/v3/projects/*`, `/v1/chat/v3/conversations/*`, `/v1/chat/v3/runs/*`; run activity, effect review, permission and process routes | Not ported | Client uses V2 WebSocket, has no durable conversation/chat selection, V3 run observation/recovery or process/effect-review workflow. Standalone GUI path has GUI-owner auth constraints. |
| Platform V3 page | `gui/src/platform/platform-page.tsx`, `platform-surface.ts` | Optional `/v3/info`, `/v3/projects/{id}/conversations`, `/v3/conversations/*`, `/v3/runs/*`, `/v3/events` | Not ported | No Platform page or V3 client adapter. V3 availability/configuration is optional. |
| PIN unlock / project picker | `gui/src/client.ts`, `projects/*`; client `src/pages/connect-page.tsx` | GUI auth adapter/owner registry; client `POST /auth/login`, `POST /v2/auth/ticket`, `GET /v1/projects` | Live | Client PIN Connect flow is not GUI durable-chat auth/recovery. |
| Project sidebar: pin/rename, chats, new chat, details | `gui/src/projects/project-sidebar.tsx` | `/v1/projects/sidebar`, `/v1/projects/update`, `/v1/projects/chat`; durable client | Partial | Client renders registry list/selection only; no pinned/renamed tree, conversation rows, per-project new-chat/menu actions or GUI chat selection. |
| Projects lifecycle: browse, preview, create, add existing, recent | `gui/src/projects/projects-page.tsx`, `projects/bootstrap-client.ts` | `/v1/projects/browse`, `/preview`, `/bootstrap`, `/register`, `/open`, `/v1/projects` | Waiting | Client has project list/reconnect and states blocker; no create/preview/register/browse/recent flow. `/v1` bootstrap/register/open may switch host-global workspace; V2 project-scoped routes are absent. |
| Parallel workspace sessions / worktrees | `gui/src/projects/project-sidebar.tsx` | `/v1/projects/{id}/workspaces` list/create/keep/open/discard | Not ported | No parallel worktree view or actions; distinct from V2-bound project selector. |
| Workspace-root setting | `gui/src/settings/workspace-sessions-panel.tsx` | `GET/POST /v1/workspace-settings` | Not ported | No client UI/API integration; changes host workspace configuration. |
| Chat prompt, cancel, permissions and tool activity | `gui/src/session/durable-chat-client.ts`, `chat/chat-pane.tsx` | Durable `/v1/chat/v3/*`; GUI legacy V1 session; client `/v2/session` | Partial | V2 transcript, cancel and permission UI exist; host API/semantics differ. Durable GUI permissions/activity/effect recovery are not equivalent to V2 tool events. |
| Resume after disconnect | GUI `session/use-durable-chat.ts`; client `src/session/use-v2-session.ts` | GUI durable V3 rehydrate; client V2 `session/resume` capability | Partial | Client reconnects a V2 session but does not wire automatic resume-capability restoration. |
| Composer text / keyboard submit | `gui/src/composer/composer.tsx`; client `src/chat/composer.tsx` | Durable GUI prompt/attachments; client V2 `session/prompt` | Partial | Text send/newline exist; V2 and durable run semantics differ. |
| Composer image attach (file, local path, paste, drag/drop) | `gui/src/composer/composer.tsx` | `POST /v1/upload` then durable image attachment locator | Not ported | Client supports prompt-based image generation, not image attachment/local file-path ingest or multimodal prompt turns. |
| Composer image generation and image turns | `gui/src/images/generate-image.ts`, `chat/chat-pane.tsx` | `POST /v1/images`, `/v1/blobs/*`; durable image-turn rendering | Partial | Client has standalone Generate image via V1; no in-session generated image turn, attachment, or durable image rendering. |
| Slash commands / session controls | `gui/src/composer/slash.ts`, `session/session-controls.ts`; client `src/chat/composer.tsx` | Local + V1 shell / durable and V2 session controls | Partial | Client supports `/help`, `/exit`, `/reset`, `/undo`, `/history`, `/model`, `/status`, `/tools`, `/shell`, `/cwd`; verify exact current GUI command semantics before calling fully equivalent. |
| Tool authorization: individual decisions / Allow all | `gui/src/session/durable-chat-client.ts`, `tool-permission-dialog.tsx` | Durable run permission activity; V2 `tool/permission` | Partial | V2 permission dialog and client-side Allow all exist; durable permission replay/recovery and confirmed-decision deduplication do not. |
| Runtime process / recovery state / effect acknowledgement | `gui/src/app.tsx`, `durable-chat-client.ts` | V3 `/process`, activity/effect-review and GUI durable snapshots | Not ported | V2 runtime/details pane does not provide durable process lifecycle, interrupted-effect acknowledgement or effect review. |
| Runtime details / workspace, branch, status | `gui/src/app.tsx`, `settings/settings-pane.tsx` | Durable workspace/process snapshots and session state | Partial | Model/session/project/status exist; V2 snapshots omit cwd and GUI worktree branch/current durable process/recovery details. |
| Runtime settings: model/parameters, reset/undo/end | `gui/src/settings/parameters-panel.tsx` | `/v1/models`, V2/GUI session control | Partial | Model, session parameters and reset/undo/end exist. Full GUI durable conversation configuration is absent. |
| Semantic model / budgets / persistent instructions | `gui/src/settings/global-settings-form.tsx` | GUI `/v1/runtime-preferences` or durable runtime preferences | Partial | Semantic/budgets/instructions exist through V2 `configureRuntime`; V2 snapshot may omit persisted values. GUI standalone saves/reloads revisioned host prefs at `/v1/runtime-preferences`. |
| Provider catalog, keys and model settings | `gui/src/settings/nvidia-catalog-panel.tsx` | `/v1/provider-settings`, `/v1/catalog/nvidia`, `/v1/catalog/kie`, optional catalog settings | Partial | Client provider/MCP panels exist. GUI form includes OpenAI/kie image/chat and additional provider keys/configuration; not confirmed field-for-field. Host-global admin scope. |
| MCP server catalog / health / probe | `gui/src/settings/mcp-servers-panel.tsx` | `/v1/mcp-servers`, `/health`, `/probe` | Partial | Client MCP panel exists; parity for current health/probe and editing actions not confirmed. |
| Skills library (installed/discover/install/remove/select) | `gui/src/skills/skills-panel.tsx` | `GET /v1/skills`, `POST /v1/skills/discover`, `/install`, `DELETE /v1/skills/{id}` | Not ported | Client lacks Skills settings view, catalog/list management and composer skill selection. GUI imports instructions from a fixed public catalog and does not execute skill code. |
| Zero Cost Radar settings | `gui/src/settings/zero-cost-radar-panel.tsx` | `/v1/catalog/zero-cost*` | Policy exclusion | Intentionally not ported by owner request. |
| Runtime capability / Stage 4 panel | `gui/src/settings/runtime-capabilities-panel.tsx` | `GET /v2/info`, capability reporting | Partial | Client Runtime panel reads V2 info; GUI includes more current recovery/capability detail and limits. |
| Appearance / themes | `gui/src/settings/appearance-panel.tsx` | local storage | Partial | Client themes exist; compare current GUI Neutral / Deep Space / Oldscool options and behavior (client owns separate theme identifiers/storage). |
| Navigation: responsive rail / hide, resize, menus | `gui/src/app.tsx`, `brand/sidebar-state.ts` | localStorage + keyboard/menu events | Partial | Client has hamburger/narrow nav and shortcuts. Persistent rail hide/resize and File/Edit/View/Help application menus are absent. |
| Keyboard shortcuts | `gui/src/app.tsx`, `help/help-page.tsx` | Local navigation/prompt actions | Partial | Client has Ctrl+Shift+G, Ctrl+`, Ctrl+T, Ctrl+P and Ctrl+Alt+S actions. Settings/sidebar/menu actions and any changed current-GUI bindings are not ported. |
| Shortcut dock / empty-state brand / starfield | `gui/src/chat/empty-shortcuts.tsx`, `starfield.tsx`, `brand/ascii-logo.tsx` | Local renderer/localStorage | Partial | Dock and ASCII empty mark exist; 4D starfield exists in GUI, client starfield was marked Local in prior inventory; visual engine/animation parity is not established. |
| Code fence detection / Code Canvas | `gui/src/artifact/*`, `gui/src/highlight/*` | Local renderer and sandboxed `srcDoc` iframe | Live | Fenced HTML detection, editor/preview/revert and highlighting exist; host-independent. |
| Chat Files float / Tools Files view | `gui/src/files/files-pane.tsx`; client `src/files/files-pane.tsx` | GUI `GET /v1/files`, `GET /v1/file`, guarded `POST /v1/file`; older V1 shell listing remains available | Partial | Client view lists tracked paths with `POST /v1/shell` `git ls-files` and opens a path via chat prompt. No directory browser, arbitrary UTF-8 file preview/edit or expected-SHA256 save. |
| Chat Workbench / sources | `gui/src/workbench/environment-panel.tsx` | durable/project snapshot + prompt/upload flows | Partial | Client Workbench float/prompt exists and delegates source UI to Tools → Upload; GUI durable process/recovery and uploaded-source attachment differ. |
| Tools → Terminal | `gui/src/terminal/terminal-pane.tsx`; client same owner module | `POST /v1/shell` | Partial | Terminal exists; V1 command runs in host process cwd, not guaranteed V2-bound project/worktree. |
| Tools → Browser | `gui/src/browser/browser-pane.tsx`; client same owner module | `/v1/browser/frame-check` + iframe | Live | Surface and owner HTTP probe exist. |
| Tools → Upload | `gui/src/upload/upload-pane.tsx`; client same owner module | `POST /v1/upload` / source store | Partial | Standalone upload view exists; V1 store may not match V2-bound project; no durable-session source attachment parity. |
| Memory Overview / relationship map / knowledge manager | `gui/src/memory/*`; client `src/memory/*` | GUI `/v1/memory` or `GET /v1/memory?projectId=...` | Partial | Client inspect uses V1/current namespace; GUI selects durable-bound projectId. No V2 project-scoped memory API. Mutation actions in current GUI inspector were not field-audited. |
| Help / repository actions / model tools | `gui/src/help/help-page.tsx`; client `src/pages/help-page.tsx` | Local shortcuts, durable/session prompt | Partial | Help, shortcuts, repository prompts and tool catalog exist; durable prompts, current GUI project/worktree context and bindings differ. |
| Legacy engine-token embedding | `gui/src/session/engine-access.ts` | `#engine=` scoped legacy V1 profile | Not ported | Desktop client deliberately uses owner PIN/device ticket instead of browser embed token. |

## Current A008 host contracts inspected

The current A008 repository defines V1 contracts for models, memory, shell,
upload/blobs, images, frame-check, MCP/health/probe, provider catalogs/settings,
projects and workspace sessions/settings, file browse/read/write, skills,
`/v1/runtime-preferences`, and standalone durable GUI resources under
`/v1/chat/v3/*`. The shared client package defines Platform `/v3/*` contracts.
This source inventory does not establish that every route is enabled by a
particular running host; `/v3/info` can report Platform unavailable when not
configured. The Tauri packaged HTTP adapter currently targets loopback-only
HTTP(S), keeps an in-process cookie jar, and proxies HTTP; it does not supply a
durable GUI owner/profile adapter or project-scoped authenticated API.
The client repository's Vite proxy forwards `/health`, `/auth`, `/v1`, and
`/v2`; it does not proxy `/v3`. The client session WebSocket remains
`ws://127.0.0.1:8787/v2/session` (`a008.v2`).

## Largest parity gaps (priority-neutral inventory)

1. Platform V3 and durable conversation/run surface; this is a distinct page,
   transport, auth boundary, and recovery model, not a page-only port.
2. Project sidebar/chat selection and complete create/browse/register lifecycle.
3. Workspace files editor/save, parallel worktrees, workspace-root setting.
4. Skills discovery/install/select and image attachment/in-session turns.
5. Durable process/effect/permission recovery and workspace/branch context.
6. Complete responsive rail/application-menu interactions and verify exact
   current settings/provider/MCP/appearance behavior.

Inventory scope: user-visible views and significant action flows, not a
pixel-level asset/CSS comparison or exhaustive field-by-field comparison of
every form. Refer to ATC-0013 archived task record for method and verification.
