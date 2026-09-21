# ATC-0012 — Lift remaining GUI owner surfaces (except Zero Cost Radar)

Task ID: ATC-0012
Parent Task: ATC-0011
Status: Complete
Owner: Grok
Created: 2026-09-21
Completed: 2026-09-21

## Outcome

The desktop client now presents the remaining A008 GUI owner surfaces except
Parameters → Zero Cost Radar (explicitly skipped). Chat stays on V2 and mutating
commands encode Stage-4 `commandId`. Memory, Terminal, Upload, Browser
frame-check, Files listing, Provider/MCP, Runtime discovery, Semantic/Budgets/
Instructions, Oldscool, and composer `/shell` plus Generate image use the same
owner HTTP the bundled GUI uses. ADR 0004 records that exception to ADR 0003.

Not in this slice: Zero Cost Radar; project bootstrap/register; composer
file/path/paste image attach; in-session image turns; automatic `session/resume`
after transport loss.

## Verification

- `npm test` — 45/45 passed.
- `npm run frontend:build` — passed; main JS 449.20 kB, 136.48 kB gzip.
- `git diff --check` — no whitespace errors; existing line-ending warnings only.
- `C:\code\a008` remained read-only.
