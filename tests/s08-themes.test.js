import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getTheme,
  isThemeName,
  listThemeNames,
  themeHelp,
  themeLabel,
} from "../src/tui/theme.js";

describe("TUI themes", () => {
  it("exposes multiple named schemes", () => {
    const names = listThemeNames();
    assert.ok(names.length >= 8);
    for (const required of [
      "default",
      "dim",
      "ocean",
      "forest",
      "amber",
      "slate",
      "crimson",
      "nord",
      "mono",
      "paper",
    ]) {
      assert.ok(names.includes(required), `missing ${required}`);
      assert.equal(isThemeName(required), true);
      const t = getTheme(required);
      assert.equal(t.name, required);
      assert.ok(t.label.length > 0);
      assert.ok(t.help.length > 0);
      assert.ok(t.bg);
      assert.ok(t.accent);
    }
  });

  it("falls back to default for unknown names", () => {
    assert.equal(getTheme("nope").name, "default");
    assert.equal(themeLabel("ocean"), "Ocean");
    assert.match(themeHelp("forest"), /зелён/i);
  });
});
