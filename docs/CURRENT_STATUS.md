# Current Status

Reality as of 2026-09-26. This document records observed state, not intended architecture.

## What exists

- Tauri 2 / Vite / React desktop client with a loopback-only Rust HTTP proxy.
- PIN login, project binding, V2 WebSocket chat and all compatible reference GUI surfaces.
- V1 owner HTTP surfaces include project lifecycle, files with revision-safe edits,
  memory, shell, upload, browser framing, images, catalog/provider/MCP, Skills,
  and Zero Cost Radar.
- Platform V3 conversations and text runs are available when `/v3/info` reports
  an enabled backend; otherwise the client renders an explicit unavailable state.
- `npm test` passes 45 tests; `npm run frontend:build` passes (459.81 kB main JS,
  139.01 kB gzip).
- `C:\code\a008` was not modified.

## Current Work

ATC-0013 is complete. No task is active.

## Established limits

- V2 image attachments/turns and automatic session resume lack compatible desktop
  contracts.
- The client never calls V1 global workspace open; project selection reconnects V2.
- Credentials remain in the Tauri process cookie jar, not a native secure store.
