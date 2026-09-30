# GUI parity matrix

Status: re-inventoried against `C:\code\a008\gui` on 2026-09-26 (ATC-0013).
The reference repository was read only. **Live** uses the A008 host via the
Tauri loopback proxy, **Local** has no host dependency, and **Unavailable** has
no compatible desktop transport contract.

| Reference GUI feature | Tauri status | Contract / evidence |
| --- | --- | --- |
| Navigation, narrow rail, connection and workspace chrome | Live | renderer + V2 state |
| Chat transcript, thoughts, stop, start actions | Live | V2 WebSocket session |
| Tool activity and permission approval | Live | V2 WebSocket session |
| Composer, slash commands, model/session controls | Live | V2 plus `/v1/shell` |
| Local starfield, shortcut dock and themes | Local | renderer/localStorage |
| Code fences and Code Canvas preview/edit/revert | Local | renderer sandbox |
| PIN unlock and registered-project selection | Live | `/auth/login`, `GET /v1/projects` |
| New project preview/bootstrap and add existing | Live | `/v1/projects/preview`, `/bootstrap`, `/register` |
| Browse/open V1 global workspace | Unavailable | intentionally not called; V2 binding reconnects by project ID |
| Files browser, text editing and SHA-256 save | Live | `/v1/files`, `GET/POST /v1/file` |
| Terminal, browser frame check and upload | Live | `/v1/shell`, `/v1/browser/frame-check`, `/v1/upload` |
| Memory overview, graph and manager | Live | `GET /v1/memory` |
| Provider settings, NVIDIA/Kie catalogs and MCP | Live | `/v1/provider-settings`, `/v1/catalog/*`, `/v1/mcp-servers` |
| Zero Cost Radar | Live | `/v1/catalog/zero-cost` and `/models` |
| Skills library discovery, install and removal | Live | `/v1/skills` |
| Runtime capabilities | Live | `GET /v2/info` |
| Platform V3 conversations and text runs | Live when host advertises V3 | `/v3/info`, conversations and runs; explicit unavailable state otherwise |
| Composer file/path/paste image attachment and image turns | Unavailable | V2 prompt remains text-only; no compatible V2 attachment contract |
| Image generation | Live | `POST /v1/images` |
| Engine `#engine=` embed token | Unavailable | desktop authenticates with PIN/ticket |
| V2 automatic `session/resume` | Unavailable | reference capability has no wired desktop reconnect contract |

## Transport boundary

Vite proxies `/auth`, `/v1`, `/v2`, `/v3` and `/health`. Packaged Tauri routes
all HTTP through `proxy_http`, which permits loopback HTTP(S) only and retains
the PIN cookie. The V2 WebSocket remains direct to the configured loopback
host with subprotocol `a008.v2`.
