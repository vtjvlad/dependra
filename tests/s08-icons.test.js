import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  entryIcon,
  glyphForDevicon,
  resolveDeviconName,
  twisty,
} from "../src/tui/icons.js";

describe("TUI Devicons", () => {
  it("resolves Devicons names for common files", () => {
    assert.equal(resolveDeviconName("app.js"), "javascript");
    assert.equal(resolveDeviconName("x.ts"), "typescript");
    assert.equal(resolveDeviconName("package.json"), "npm");
    assert.equal(resolveDeviconName("README.md"), "markdown");
    assert.equal(resolveDeviconName("Dockerfile"), "docker");
  });

  it("glyphForDevicon returns a non-empty string for javascript", () => {
    const g = glyphForDevicon("javascript");
    assert.equal(typeof g, "string");
    assert.ok(g && g.length > 0);
  });

  it("entryIcon returns Devicons/Nerd glyphs (not emoji)", () => {
    const js = entryIcon("index.js", false);
    assert.notEqual(js, "📜");
    assert.ok(js.length >= 1);

    const dir = entryIcon("src", true, false);
    assert.notEqual(dir, "📁");
    assert.ok(dir.length >= 1);

    assert.equal(twisty(true, true), "▾");
  });
});
