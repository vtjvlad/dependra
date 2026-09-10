import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, before, after } from "node:test";
import { parseArgs } from "../src/cli/parse-args.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "src/cli/index.js");
const fixture = join(root, "tests/fixtures/s07");

/**
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv }} [opts]
 */
function runCli(args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, ...args], {
      cwd: opts.cwd ?? fixture,
      env: { ...process.env, NO_COLOR: "1", ...(opts.env ?? {}) },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d;
    });
    child.stderr.on("data", (d) => {
      stderr += d;
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

describe("S07 parse-args", () => {
  it("S07 shorts and default-all exclusion", () => {
    const def = parseArgs(["file.js"]);
    assert.equal(def.options.format, false);
    assert.equal(def.options.fixImports, false);
    assert.equal(def.options.apply, false);

    const f = parseArgs(["file.js", "-f"]);
    assert.equal(f.options.format, true);
    assert.equal(f.options.basic, false);

    const mut = parseArgs(["file.js", "-fi", "-si", "-ap", "-dr"]);
    assert.equal(mut.options.fixImports, true);
    assert.equal(mut.options.sortImports, true);
    assert.equal(mut.options.apply, true);
    assert.equal(mut.options.dryRun, true);
    assert.equal(mut.options.basic, false);
  });
});

describe("S07 CLI AC", () => {
  const messyPath = join(fixture, "src/messy.js");
  let messyOriginal;

  before(() => {
    messyOriginal = readFileSync(messyPath, "utf8");
  });

  after(() => {
    writeFileSync(messyPath, messyOriginal, "utf8");
    const backup = join(fixture, ".dependra");
    if (existsSync(backup)) rmSync(backup, { recursive: true, force: true });
  });

  it("--format preview does not mutate file", async () => {
    const before = readFileSync(messyPath, "utf8");
    const r = await runCli(["src/messy.js", "-f", "-j"]);
    assert.equal(r.code, 0, r.stderr);
    const report = JSON.parse(r.stdout);
    assert.equal(report.options.format, true);
    assert.equal(report.options.apply, false);
    assert.ok(report.results.modification);
    assert.equal(report.results.modification.data.mode, "preview");
    assert.ok(report.results.modification.data.changes.length >= 1);
    assert.equal(readFileSync(messyPath, "utf8"), before);
    assert.equal(report.results["basic-file-information"], undefined);
  });

  it("--dry-run wins over --apply", async () => {
    const before = readFileSync(messyPath, "utf8");
    const r = await runCli(["src/messy.js", "-f", "--apply", "--dry-run", "-j"]);
    assert.equal(r.code, 0, r.stderr);
    const report = JSON.parse(r.stdout);
    assert.equal(report.results.modification.data.mode, "dry-run");
    assert.equal(readFileSync(messyPath, "utf8"), before);
  });

  it("-f --apply writes + backup; --undo restores", async () => {
    writeFileSync(messyPath, messyOriginal, "utf8");
    const before = readFileSync(messyPath, "utf8");
    const r = await runCli(["src/messy.js", "-f", "--apply", "-j"]);
    assert.equal(r.code, 0, r.stderr);
    const report = JSON.parse(r.stdout);
    assert.equal(report.results.modification.data.mode, "apply");
    assert.ok(report.results.modification.data.backup?.sessionId);
    const after = readFileSync(messyPath, "utf8");
    assert.notEqual(after, before);
    assert.match(after, /\n$/);

    const u = await runCli(["--undo", "-j"]);
    assert.equal(u.code, 0, u.stderr);
    assert.equal(readFileSync(messyPath, "utf8"), before);
  });

  it("-si sorts imports on fixture", async () => {
    writeFileSync(messyPath, messyOriginal, "utf8");
    const r = await runCli(["src/messy.js", "-si", "-j"]);
    assert.equal(r.code, 0, r.stderr);
    const changes = r.stdout.includes("sort-imports");
    assert.equal(changes, true);
    const report = JSON.parse(r.stdout);
    const ch = report.results.modification.data.changes.find(
      (c) => c.op === "sort-imports",
    );
    assert.ok(ch);
    assert.match(ch.after, /import fs from "fs"/);
  });

  it("-fi removes unused import", async () => {
    const target = join(fixture, "src/unused-imp.js");
    const original = readFileSync(target, "utf8");
    try {
      const r = await runCli(["src/unused-imp.js", "-fi", "--apply", "-j"]);
      assert.equal(r.code, 0, r.stderr);
      const text = readFileSync(target, "utf8");
      assert.equal(text.includes("dead"), false);
      assert.equal(text.includes('from "fs"'), true);
    } finally {
      writeFileSync(target, original, "utf8");
    }
  });

  it("-id dry-run does not exec PM", async () => {
    const r = await runCli(["src/lib.js", "-id", "--dry-run", "--apply", "-j"]);
    assert.equal(r.code, 0, r.stderr);
    const report = JSON.parse(r.stdout);
    assert.equal(report.results.modification.data.mode, "dry-run");
    const ch = report.results.modification.data.changes.find(
      (c) => c.op === "install-deps",
    );
    assert.ok(ch);
    assert.equal(ch.kind, "exec");
    assert.equal(ch.risk, "dangerous");
  });

  it("-am with mock provider previews patch", async () => {
    const r = await runCli([
      "src/lib.js",
      "-am",
      "-j",
      "-cf",
      "ai-mock.conf",
    ]);
    assert.equal(r.code, 0, r.stderr);
    const report = JSON.parse(r.stdout);
    const ch = report.results.modification.data.changes.find(
      (c) => c.op === "ai-modify",
    );
    assert.ok(ch);
    assert.equal(ch.skippedReason, undefined);
    assert.match(ch.after, /dependra-ai-mod/);
  });

  it("-am with ai disabled skips", async () => {
    const r = await runCli(["src/lib.js", "-am", "-j"]);
    assert.equal(r.code, 0, r.stderr);
    const report = JSON.parse(r.stdout);
    const ch = report.results.modification.data.changes[0];
    assert.equal(ch.skippedReason, "ai-disabled");
  });

  it("help lists operations · s07", async () => {
    const r = await runCli(["--help"]);
    assert.equal(r.code, 0);
    assert.match(r.stdout, /operations · s07/);
    assert.match(r.stdout, /--format/);
    assert.match(r.stdout, /--apply/);
  });

  it("-sc keeps license banner", async () => {
    const target = join(fixture, "src/comments.js");
    const original = readFileSync(target, "utf8");
    try {
      const r = await runCli(["src/comments.js", "-sc", "--apply", "-j"]);
      assert.equal(r.code, 0, r.stderr);
      const text = readFileSync(target, "utf8");
      assert.match(text, /SPDX-License-Identifier/);
      assert.equal(text.includes("remove me"), false);
    } finally {
      writeFileSync(target, original, "utf8");
    }
  });
});
