# ATC-0010 â€” Remove duplicate empty-chat shortcuts

Status: Complete
Completed: 2026-09-16

## Outcome

The empty chat centre no longer renders the Review / Terminal / Browser / Files / Workbench shortcut list. The persistent ShortcutDock and all keyboard shortcuts remain unchanged.

## Changes

- Removed `EmptyShortcuts` from `ChatPane`.
- Removed the now-unused `onShortcut` prop from `ChatPane`.
- Kept `ShortcutDock` in `App` as the single shortcut surface.

## Verification

- `npm test` â€” 38/38 passed.
- `npm run frontend:build` â€” passed.
