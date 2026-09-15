# System Document

Durable behavior that actually exists for `a008-tauri_client`. This document is intentionally small during bootstrap and must describe implemented behavior, not aspirations.

## Current Runtime Boundary

The client currently provides a Tauri 2 host with a Vite-served frontend. The host opens a resizable `A008 Client` window and loads the minimal readiness screen. No client-to-A008 runtime contract is frozen yet.

## Build Contract

- `npm run frontend:dev` serves the frontend at `http://127.0.0.1:1420`.
- `npm run frontend:build` produces the frontend distribution in `dist/`.
- `npm run dev` and `npm run build` invoke the Tauri CLI and require the Rust/Tauri platform toolchain. The A008 source repository at `C:\code\a008` is a read-only reference during client development; client code must not assume that inspecting source is equivalent to having a stable public API.

## Documentation Authority

- `CURRENT_TASK.md` — the single active task charter.
- `CURRENT_STATUS.md` — observed repository and work state.
- `PROJECT_BRIEF.md` — product purpose and durable project boundaries.
- `SYSTEMDOC.md` — implemented system behavior and contracts.
- `FILESTRUCTURE.md` — authoritative map of important paths.
- `JOURNAL.md` — append-only decisions and milestones.
