# File Structure

## Repository Root

- `AGENTS.md` — repository entry point and docs-first requirements.
- `package.json` — npm scripts and frontend development dependencies.
- `package-lock.json` — locked npm dependency graph.
- `.gitignore` — excludes generated dependencies and build output.
- `index.html` — frontend entry document.
- `src/` — frontend source code.
- `vite.config.js` — frontend development/build configuration.
- `src-tauri/` — Tauri manifest and Rust host application.
- `README.md` — local setup and verification commands.
- `docs/` — docs-first control plane.

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
