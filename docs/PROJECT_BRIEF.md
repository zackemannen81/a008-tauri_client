# Project Brief

Status: Active bootstrap direction.

## Purpose

`a008-tauri_client` is the desktop Tauri client for A008. It will provide a local user interface and client-side integration surface for the A008 runtime while keeping the client repository independently understandable and maintainable.

## Repository Roles

- Client repository: `C:\code\a008-tauri_client` — application code, tests, packaging, and project control-plane documentation.
- A008 source repository: `C:\code\a008` — read-only reference/source for understanding A008 behavior and contracts.
- Changes to `C:\code\a008` are out of scope for this project unless explicitly authorized in a future task.

## Initial Product Principles

- Prefer documented contracts over assumptions about the source repository.
- Keep integration adapters narrow and testable.
- Record durable decisions in `docs/` rather than relying on chat history.
- Keep generated output and exploratory notes out of the authoritative control plane.
