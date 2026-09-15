# ATC-0004 — Owner PIN login and project list at start

Task ID: ATC-0004
Parent Task: ATC-0003
Status: Complete
Owner: Rickard
Created: 2026-09-15
Completed: 2026-09-15

## Task Summary

Use the owner PIN the operator already has, then list registered projects at
startup so Connect does not require a device grant or a pasted project UUID.

## Verification

- `npm test` — 16/16 passed (PIN ticket omits Bearer; project listing parse).
- `npm run frontend:build` — passed.
- Proxied `GET /v1/projects` returned `401 Authentication required.`
- Live PIN unlock against a running host was not completed in this slice
  (host stopped accepting connections after the 401 check).
- `C:\code\a008` unchanged.
