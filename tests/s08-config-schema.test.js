import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ANALYSIS_OPS,
  MUTATE_OPS,
  configSections,
  tuiSections,
} from "../src/tui/popups/config-schema.js";
import { OPERATION_KEYS } from "../src/config/index.js";

describe("TUI configurator schema", () => {
  it("groups config into titled sections with help", () => {
    const sections = configSections();
    assert.ok(sections.length >= 5);
    for (const s of sections) {
      assert.ok(s.title.length > 0);
      assert.ok(s.help.length > 0);
      assert.ok(s.fields.length > 0);
      for (const f of s.fields) {
        assert.ok(f.label.length > 0);
        assert.ok(f.help.length > 0);
      }
    }
  });

  it("covers all OPERATION_KEYS across analysis+mutate", () => {
    const keys = new Set([
      ...ANALYSIS_OPS.map((o) => o.key),
      ...MUTATE_OPS.map((o) => o.key),
    ]);
    for (const k of OPERATION_KEYS) {
      assert.ok(keys.has(k), `missing op ${k}`);
    }
  });

  it("tui sections describe appearance and browser", () => {
    const ids = tuiSections().map((s) => s.id);
    assert.ok(ids.includes("tui-appearance"));
    assert.ok(ids.includes("tui-browser"));
  });
});
