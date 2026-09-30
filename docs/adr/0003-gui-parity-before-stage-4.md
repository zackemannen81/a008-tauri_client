# ADR 0003 — GUI parity uses stable contracts; V1 global workspace is not emulated

Status: Accepted
Date: 2026-09-15
Task: ATC-0008
Amends: ADR 0001

## Context

The A008 GUI under `C:\code\a008\gui` is the functional reference for this
desktop client. It still speaks V1 HTTP and V1 WebSocket. Many of those
routes bind to the host’s **global** workspace (open/bootstrap/register,
shell cwd, upload/image store, memory inspect).

This client is project-bound over V2: one socket, one registered project.
CLIENT_API_V2.md maps the GUI functions onto future `/v2/projects/{id}/…`
routes that the current host answers as `UNSUPPORTED_CAPABILITY`.

Stage 4 (resume/idempotency) is a later host program. Shipping it here
first would freeze reconnect behavior against an incomplete contract.

## Decision

1. Treat `C:\code\a008\gui` as the reference for user-visible behavior.
   Inventory lives in [`docs/GUI_PARITY.md`](../GUI_PARITY.md).
2. Transfer features that are local, or that use implemented V2 session
   commands (`configure` included), or the existing best-effort V1 reads
   (`GET /v1/projects`, `GET /v1/models`).
3. Do not call V1 workspace switch, shell, upload, memory inspect, or
   images. Do not reimplement their global-workspace meaning in the
   renderer.
4. Do not port GUI **global** runtime preferences
   (`configureRuntime`, “all projects and models”) until V2 snapshots
   expose project-scoped settings. The control action existing on the
   wire is not enough: V2 `state` is strict and omits `runtimePreferences`.
5. Stage 4 remains out of scope until this parity slice is done.

## Consequences

Chat chrome (shortcuts, Canvas, Files/Workbench floats, Tools tabs,
Browser iframe, Model parameters) can match the GUI without waiting for
the host. Memory, Terminal, Upload, project create, catalog, images, and
global instructions stay honest waiting surfaces. The matrix is the
backlog input for later A008 V2 HTTP work.
