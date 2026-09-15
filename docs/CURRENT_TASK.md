# Current Task

Task ID: ATC-0002
Parent Task: ATC-0001
Status: Complete
Owner: Rickard
Created: 2026-09-15
Last updated: 2026-09-15
Charter frozen at: 2026-09-15
Completed: 2026-09-15

## Task Summary

Implement the minimal Tauri base for the A008 desktop client.

## Primary Deliverable

A runnable Tauri application scaffold with a minimal frontend, Rust host, development configuration, and documented verification path.

## Scope

- Establish the Tauri application and package structure in this repository.
- Add the minimal frontend entry point and Tauri Rust host entry point.
- Configure development and build commands using the repository's chosen toolchain.
- Verify that the base launches or builds successfully in the available environment.
- Keep the A008 source repository at `C:\code\a008` read-only.

## Out of Scope

- A008 transport, authentication, or runtime integration.
- Production UI design and feature workflows.
- Packaging, signing, auto-update, or release automation.
- Modifying `C:\code\a008`.

## Definition of Done

- The repository contains a coherent minimal Tauri base.
- The frontend and Rust host entry points are connected through Tauri configuration.
- The documented development/build verification command is available and run where environment support permits.
- `docs/CURRENT_STATUS.md`, `docs/SYSTEMDOC.md`, and `docs/JOURNAL.md` reflect the observed result.
