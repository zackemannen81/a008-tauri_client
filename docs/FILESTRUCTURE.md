# File Structure

## Repository Root

- `AGENTS.md` — repository entry point and docs-first requirements.
- `package.json` — npm scripts and frontend dependencies.
- `package-lock.json` — locked npm dependency graph.
- `.gitignore` — excludes generated dependencies and build output.
- `index.html` — frontend entry document.
- `public/` — static frontend assets (app icon, ACME-engine certified mark).
- `src/` — frontend source code.
- `test/` — Node test loader that resolves `.js` specifiers to `.ts`/`.tsx`.
- `vite.config.js` — Vite/React development and A008 host proxy.
- `tsconfig.json` — frontend typecheck.
- `src-tauri/` — Tauri manifest, capabilities, and Rust host with loopback HTTP proxy.
- `README.md` — local setup and verification commands.
- `docs/` — docs-first control plane.

## Frontend

- `src/main.tsx` — React mount and theme boot.
- `src/app.tsx` — workspace shell and page routing.
- `src/brand/` — A008 visual tokens, mark, and ASCII empty-chat logo.
- `src/host/` — V2 HTTP/WebSocket adapter, Tauri loopback fetch, connection storage.
- `src/session/` — session hook and tool-permission dialog.
- `src/chat/` — transcript, composer, start actions.
- `src/pages/` — Connect, Memory, Tools, Help, Projects.
- `src/settings/` — Parameters dialog (theme and session controls).

## Control Plane

- `docs/CURRENT_TASK.md` — active task charter.
- `docs/TASK_IDS.md` — task identity register.
- `docs/TASK_WORKFLOW.md` — lifecycle and continuity rules.
- `docs/PROJECT_BRIEF.md` — product purpose and repository boundary.
- `docs/CURRENT_STATUS.md` — observed state.
- `docs/SYSTEMDOC.md` — implemented behavior and contracts.
- `docs/JOURNAL.md` — append-only project history.
- `docs/adr/` — durable architectural decisions.
- `docs/backlog/` — future work not currently active.
- `docs/finished/` and `docs/paused/` — completed or paused task records.

## External Reference

- `C:\code\a008` — read-only A008 source/reference repository; it is not part of this repository's writable source tree.
