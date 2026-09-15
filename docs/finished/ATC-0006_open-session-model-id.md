# ATC-0006 — Fix Open session V2 model id and WebSocket

Status: Complete
Owner: Rickard
Completed: 2026-09-15

Open session failed after PIN unlock because `session/new` sent model ids
that fail the V2 id regex. Sessions are now created without that field;
the selected model is applied with `session/control`. The WebSocket targets
the A008 host on port 8787.

Verification: 17/17 tests; `frontend:build` passed.
