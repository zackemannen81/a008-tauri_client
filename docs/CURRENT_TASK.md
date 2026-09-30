# Current Task

Task ID: ATC-0014
Parent Task: None
Status: In Progress
Owner: A008
Created: 2026-09-30
Last updated: 2026-09-30
Charter frozen at: 2026-09-30

## Task Summary

Bring the Tauri client up to date with the current A008 GUI by closing the actionable gaps inventoried in `docs/GUI_PARITY.md`. The reference is the read-only `C:\\code\\a008\\gui`; recheck its revision and contracts when implementation begins rather than assuming the ATC-0013 snapshot is still current.

## Task Charter

### Goal

Deliver the broadest safe, maintainable functional parity with the current A008 GUI using contracts the client can support, while making genuine host/authentication limitations explicit instead of simulating success.

### Primary Deliverable

An updated Tauri client and parity matrix in which every material current-GUI surface is implemented and verified as equivalent, or explicitly classified as a policy exclusion or a blocker that cannot be resolved client-side. Keep A008 source read-only.

### In Scope

- Re-inventory the GUI and relevant host/API contracts at the start of implementation; reconcile source revision and update the matrix as work progresses.
- Close client-side gaps in Platform V3 and durable project conversations/runs, project/chat navigation and lifecycle, and safe workspace-scoped project binding.
- Implement compatible workspace file browse/read/edit, parallel workspace sessions and workspace-root settings where the existing host contracts and client security boundary permit.
- Complete Skills discovery/install/remove/select and image attachment/paste/drop/in-session rendering where supported.
- Address session/run recovery, permission/effect/process state and workspace/branch context where supported by existing contracts.
- Audit and close applicable navigation, keyboard/menu, settings, provider/MCP, appearance and other behavior gaps in the parity matrix.
- Add or update focused tests, user-facing unavailable/error states, and durable documentation for behavior and remaining blockers.

### Out of Scope

- Any modification to `C:\\code\\a008`, its GUI, or host implementation/API; it is a read-only reference.
- Porting Parameters → Zero Cost Radar, which remains excluded by the recorded owner request unless the owner explicitly changes that decision.
- Replacing the client's authentication/security model with legacy GUI engine-token embedding, weakening loopback/proxy restrictions, or exposing host credentials.
- Pixel-perfect duplication, unrelated redesign/refactoring, and claiming live-host compatibility without verification.

### Definition of Done

- The current GUI and client have been re-compared; the parity matrix identifies its observed source revision and has no stale classifications for material GUI flows.
- Each actionable gap in scope is implemented with appropriate automated coverage and is classified Live/equivalent only when behavior is supported; unsupported host/auth paths have honest, actionable limitations and are listed as blocked rather than hidden.
- No regressions to existing client behavior; no unintended host or credential changes.
- Project status, system documentation where contracts changed, journal, and a completed task record are updated.

### Minimum Verification Gates

- [ ] Reinspect current GUI and host source at `C:\\code\\a008`; confirm its worktree remains unchanged.
- [ ] Run `npm test` and `npm run frontend:build`; add/run focused tests for each implemented adapter and interaction.
- [ ] Run `git diff --check`; review changed files and verify `C:\\code\\a008` remains untouched.
- [ ] Exercise applicable host-backed flows against an available test host without creating/storing user credentials; record unverified/live limitations.
- [ ] Update the parity matrix, current status, journal, and archive this task with results before closing.
