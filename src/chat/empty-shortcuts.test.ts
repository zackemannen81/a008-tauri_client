import assert from "node:assert/strict";
import { test } from "node:test";
import {
  persistShortcutDockVisible,
  SHORTCUT_DOCK_STORAGE_KEY,
  shortcutDockVisible,
} from "./empty-shortcuts.js";

test("shortcut dock is visible unless storage says hidden", () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
  assert.equal(shortcutDockVisible(storage), true);
  persistShortcutDockVisible(false, storage);
  assert.equal(store.get(SHORTCUT_DOCK_STORAGE_KEY), "hidden");
  assert.equal(shortcutDockVisible(storage), false);
  persistShortcutDockVisible(true, storage);
  assert.equal(shortcutDockVisible(storage), true);
});
