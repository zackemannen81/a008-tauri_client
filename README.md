# A008 Tauri Client

Minimal Tauri 2 desktop client base for A008.

## Prerequisites

- Node.js and npm
- Rust toolchain (`rustup`, `cargo`, and `rustc`)
- Tauri platform prerequisites for the target operating system

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

`npm run frontend:build` builds the web frontend without invoking Rust and is useful for checking the frontend independently.
