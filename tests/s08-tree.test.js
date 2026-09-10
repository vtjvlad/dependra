import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  buildVisibleTree,
  formatTreeLabel,
  listChildren,
} from "../src/tui/screens/file-browser.js";
import { entryIcon, twisty } from "../src/tui/icons.js";

describe("TUI file tree", () => {
  it("lists dirs before files and skips node_modules", () => {
    const root = mkdtempSync(join(tmpdir(), "dependra-tree-"));
    mkdirSync(join(root, "src"));
    mkdirSync(join(root, "node_modules"));
    writeFileSync(join(root, "a.js"), "export {};\n");
    writeFileSync(join(root, "node_modules", "x.js"), "export {};\n");

    const kids = listChildren(root, { showHidden: false });
    assert.equal(kids.some((k) => k.name === "node_modules"), false);
    assert.equal(kids[0].name, "src");
    assert.equal(kids[0].isDir, true);
  });

  it("buildVisibleTree expands only marked dirs", () => {
    const root = mkdtempSync(join(tmpdir(), "dependra-tree-"));
    mkdirSync(join(root, "src"));
    writeFileSync(join(root, "src", "app.js"), "export {};\n");
    writeFileSync(join(root, "readme.md"), "# x\n");

    const expanded = new Set([root]);
    const collapsed = buildVisibleTree(root, expanded, {});
    assert.ok(collapsed.some((r) => r.name === "src" && r.isDir));
    assert.equal(
      collapsed.some((r) => r.name === "app.js"),
      false,
    );

    expanded.add(join(root, "src"));
    const open = buildVisibleTree(root, expanded, {});
    assert.ok(open.some((r) => r.name === "app.js"));
  });

  it("formatTreeLabel includes twisty and name", () => {
    const theme = { header: "cyan", accent: "green", dim: "gray" };
    const label = formatTreeLabel(
      {
        name: "src",
        path: "/p/src",
        isDir: true,
        depth: 1,
        expanded: false,
        isLast: true,
        ancestorsLast: [],
      },
      theme,
    );
    assert.match(label, /▸/);
    assert.match(label, /src/);
  });

  it("entryIcon returns a glyph", () => {
    assert.ok(entryIcon("x.js", false).length >= 1);
    assert.equal(twisty(true, true), "▾");
    assert.equal(twisty(false, false), " ");
  });
});
