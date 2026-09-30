# ATC-0013 — Current A008 GUI inventory and parity refresh

Status: Complete
Owner: A008
Created: 2026-09-30
Closed: 2026-09-30

## Outcome

Re-inventoried the read-only `C:\code\a008\gui` source at A008 revision
`4ab38e5` (2026-09-30, `Prevent replay of confirmed GUI permission decisions`)
and compared its current views, controls, projects, HTTP transports, and session
flows with the Tauri client. Replaced the stale ATC-0012-era `docs/GUI_PARITY.md`
with the current 2026-09-30 observation and concrete parity gaps.

## Newly identified source surfaces

- Platform V3: optional durable platform discovery, project/conversation
  selection and creation, revision-bound run/retry, event polling, and run
  status under `/v3/*`.
- Durable project chat: project/chat sidebar and durable conversations/runs
  under `/v1/chat/v3/*`, distinct from Platform V3 and the client's V2 socket.
- Projects: project creation preview/bootstrap, existing-project registration,
  folder browsing, pinned/renamed projects, project chat selection, and recent
  projects.
- Parallel sessions: create/open/keep/discard isolated workspace sessions and
  edit the global workspace root.
- Skills: installed-skill listing, catalog discovery, installation/removal,
  and selecting a skill for the composer.
- Settings: expanded provider key/model settings, workspace sessions, skills,
  Zero Cost Radar, V2 runtime capabilities, and appearance.
- Host workspace Files: browse/read/save UTF-8 text with SHA-256 guarded writes;
  distinct from the older `git ls-files` listing.
- Composer: select/upload/paste/drop a local image or local image path as an
  in-session prompt attachment; durable chat and image-turn rendering.
- Shell/session: durable run activity and recovery acknowledgement/process
  stop, plus legacy V1 owner session/engine-token compatibility paths.
- Navigation: resizable/hideable persistent rail, project/chat tree and context
  menu, application menus, project-aware session workspace/branch indicators.

## Verification performed

- Confirmed the GUI source working tree is clean and recorded its HEAD above.
- Inspected current GUI app/router, settings, project and workspace flows,
  chat/session and platform clients, and A008 host route dispatch.
- Inspected current client app, views, adapters, Vite configuration, and Tauri
  loopback HTTP proxy. No application code or files under `C:\code\a008` were
  modified.
- `npm ci` restored initially missing local dependencies from the lockfile;
  `npm test` passed 45/45; `npm run frontend:build` passed; `git diff --check`
  passed. The GUI working tree remained clean and `C:\code\a008` was not modified.

## Completion

`docs/GUI_PARITY.md` is the refreshed source-of-truth matrix. This is an
inventory task only: no client runtime changes were authorized or made.
