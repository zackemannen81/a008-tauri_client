# ATC-0013 — Complete current GUI parity

Task ID: ATC-0013
Parent Task: None
Status: Complete
Owner: A008
Created: 2026-09-26
Completed: 2026-09-26

## Outcome

Re-inventoried the current reference GUI and completed all surfaces with a
compatible desktop HTTP/WebSocket contract. The client now includes V1 file
browse/edit, project preview/bootstrap/register, Skills, Zero Cost Radar, and
the Platform V3 surface. V3 reports an explicit unavailable state when its
host backend is disabled. The parity matrix records remaining unavailable
features with their contract evidence.

## Verification

- `npm test` — 45/45 passed.
- `npm run frontend:build` — passed; main JS 459.81 kB, 139.01 kB gzip.
- `git diff --check` — passed.
- `C:\code\a008` was read only.
