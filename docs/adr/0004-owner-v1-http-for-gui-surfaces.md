# ADR 0004 — Owner PIN client may use GUI V1 HTTP for unmatched surfaces

Status: Accepted
Date: 2026-09-21
Task: ATC-0012
Amends: ADR 0003

## Context

ADR 0003 kept this client off V1 workspace mutations because those routes read
or write the host's **current** V1 workspace, not the V2 project binding.
A008 still has no V2 HTTP for memory, shell, upload, images, catalog, MCP or
frame-check. The owner asked to lift the Tauri client so it has the A008 GUI
surfaces, except Zero Cost Radar.

This client is an owner PIN desktop UI for the same localhost host as the
bundled GUI. Chat remains the V2 session.

## Decision

1. Keep Connect + chat on implemented V2 (`commandId` on mutations).
2. Call the same owner V1 HTTP the GUI uses for Memory, Terminal, Upload,
   Browser frame-check, Files `git ls-files`, Provider/MCP, images generate,
   and `configureRuntime`.
3. Do not port Parameters → Zero Cost Radar.
4. Do not make `POST /v1/projects/open` the default bind path; selecting a
   listed project still reconnects the V2 socket by id.

## Consequences

Those owner surfaces work against the host's current V1 workspace, which may
differ from the V2-bound project if another client switched it. Project create
and in-session image attach remain later work. Stage 4 resume is stored on
`session/new` results but is not yet the reconnect path.
