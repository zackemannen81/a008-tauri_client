import assert from "node:assert/strict";
import { test } from "node:test";
import { clampSidebarWidth, DEFAULT_SIDEBAR_WIDTH, persistSidebarHidden, persistSidebarWidth, readSidebarHidden, readSidebarWidth } from "./sidebar-state.js";
test("sidebar width is bounded and persists", () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
  assert.equal(clampSidebarWidth(1), 208);
  assert.equal(clampSidebarWidth(900), 480);
  persistSidebarWidth(310.7, storage); assert.equal(readSidebarWidth(storage), 311);
  persistSidebarHidden(true, storage); assert.equal(readSidebarHidden(storage), true);
});
test("malformed sidebar preferences fall back to the default", () => {
  const storage = { getItem: () => "not-a-number", setItem: () => undefined };
  assert.equal(readSidebarWidth(storage), DEFAULT_SIDEBAR_WIDTH);
});
