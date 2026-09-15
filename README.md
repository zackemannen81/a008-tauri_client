# A008 Tauri Client

Desktop client 0.1 for A008. Chat speaks the implemented V2 host surface.
Memory, Tools and project bootstrap wait for V2 HTTP that the current A008
host does not expose.

## Prerequisites

- Node.js and npm
- A running A008 host (`npm run gui-host` in `C:\code\a008`, default
  `http://127.0.0.1:8787`)
- The same six-digit PIN used by the A008 GUI (`A008_GUI_PIN`)

- Rust toolchain is required only for `npm run dev` / `npm run build` (Tauri).
  `npm run frontend:dev` and `npm run frontend:build` do not need Rust.

## Development

```sh
npm install
npm test
npm run frontend:dev
```

The Vite dev server listens on `http://127.0.0.1:1420` and proxies `/v2`,
`/v1` and `/health` to `http://127.0.0.1:8787`. Leave the Connect host field
empty so the renderer stays same-origin. The A008 host does not send CORS
headers.

Override the proxy target with `A008_HOST` if the host is not on 8787.

## Build

```sh
npm run frontend:build
npm run build
```

`frontend:build` typechecks and produces `dist/`. The full Tauri build needs
the Rust/Tauri platform toolchain.
