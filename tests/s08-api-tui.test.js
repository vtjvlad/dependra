import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { parseConf } from "../src/config/parse-conf.js";
import {
  emptyConfigModel,
  normalizeConfData,
  serializeConf,
  saveConf,
  OPERATION_KEYS,
} from "../src/config/index.js";
import {
  analyze,
  listOperations,
  optionsFromKeys,
  registerBuiltins,
  formatText,
} from "../src/api/index.js";
import { runTui } from "../src/tui/index.js";

describe("S08 serializeConf", () => {
  it("round-trips known keys via parseConf + normalize", () => {
    const model = emptyConfigModel();
    model.pathMode = "absolute";
    model.operations.graph = true;
    model.operations.quality = true;
    model.report.style = "plain";
    model.ai.enabled = true;
    model.profiles.quick = { operations: { basic: true, graph: true } };

    const text = serializeConf(model);
    const parsed = parseConf(text);
    assert.equal(parsed.ok, true);
    const norm = normalizeConfData(parsed.data);
    assert.equal(norm.ok, true);
    assert.equal(norm.model.pathMode, "absolute");
    assert.equal(norm.model.operations.graph, true);
    assert.equal(norm.model.operations.quality, true);
    assert.equal(norm.model.report.style, "plain");
    assert.equal(norm.model.ai.enabled, true);
    assert.equal(norm.model.profiles.quick.operations.basic, true);
  });

  it("saveConf writes file", () => {
    const dir = mkdtempSync(join(tmpdir(), "dependra-conf-"));
    const path = join(dir, "dependra.conf");
    const saved = saveConf(path, emptyConfigModel());
    assert.equal(saved.ok, true);
    const text = readFileSync(path, "utf8");
    assert.match(text, /\[operations\]/);
    assert.match(text, /pathMode =/);
  });
});

describe("S08 public API", () => {
  it("listOperations covers OPERATION_KEYS + explain", () => {
    const ops = listOperations();
    const keys = new Set(ops.map((o) => o.key));
    for (const k of OPERATION_KEYS) {
      assert.ok(keys.has(k), `missing op ${k}`);
    }
    assert.ok(keys.has("explain"));
    assert.ok(ops.every((o) => ["analysis", "mutate", "ai"].includes(o.group)));
  });

  it("optionsFromKeys defaults to s01-all when empty", () => {
    const opts = optionsFromKeys([]);
    assert.equal(opts.basic, true);
    assert.equal(opts.imports, true);
    assert.equal(opts.graph, true);
    assert.equal(opts.quality, false);
  });

  it("optionsFromKeys sets dryRun for mutate", () => {
    const opts = optionsFromKeys(["format"]);
    assert.equal(opts.format, true);
    assert.equal(opts.dryRun, true);
  });

  it("analyze fixture returns report", async () => {
    registerBuiltins();
    const fixture = join(
      process.cwd(),
      "tests/fixtures/mvp/src/app.js",
    );
    const { report, exitCode } = await analyze({
      targetPath: fixture,
      cwd: process.cwd(),
      options: optionsFromKeys(["basic"]),
    });
    assert.equal(typeof report.version, "string");
    assert.ok(report.results["basic-file-information"]);
    assert.equal(typeof exitCode, "number");
    const text = formatText(report, { color: false });
    assert.ok(text.includes("dependra") || text.length > 0);
  });
});

describe("S08 TUI entry", () => {
  it("runTui rejects non-TTY", async () => {
    const code = await runTui();
    // CI / piped stdin is typically non-TTY
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      assert.equal(code, 1);
    }
  });

  it("--tui without TTY exits 1 via CLI", async () => {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync(
      process.execPath,
      ["src/cli/index.js", "--tui"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    assert.equal(r.status, 1);
    assert.match(r.stderr, /TTY/i);
  });
});
