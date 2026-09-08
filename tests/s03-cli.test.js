import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CLI = join(ROOT, "src/cli/index.js");
const FIXTURE = join(__dirname, "fixtures/s03");

/**
 * @param {string[]} args
 * @param {{ cwd?: string }} [opts]
 * @returns {Promise<{ code: number|null, stdout: string, stderr: string }>}
 */
function runCli(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: opts.cwd ?? FIXTURE,
      env: { ...process.env, NO_COLOR: "1" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => {
      stdout += c;
    });
    child.stderr.on("data", (c) => {
      stderr += c;
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

/**
 * @param {object} report
 * @returns {object[]}
 */
function diags(report) {
  return report.results.validation?.data?.diagnostics ?? [];
}

describe("S03 CLI AC", () => {
  it("--validate/-va returns validation diagnostics key", async () => {
    const { code, stdout } = await runCli([
      "src/sideeffect.js",
      "--validate",
      "--json",
    ]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.validate, true);
    assert.deepEqual(Object.keys(report.results), ["validation"]);
    assert.ok(report.results.validation.data.summary);
    assert.ok(Array.isArray(report.results.validation.data.diagnostics));
  });

  it("-va short matches --validate", async () => {
    const short = JSON.parse(
      (await runCli(["src/sideeffect.js", "-va", "-j"])).stdout,
    );
    const long = JSON.parse(
      (await runCli(["src/sideeffect.js", "--validate", "--json"])).stdout,
    );
    assert.deepEqual(Object.keys(short.results), Object.keys(long.results));
    assert.equal(short.options.validate, true);
  });

  it("CYCLE when A↔B through target", async () => {
    const { code, stdout } = await runCli([
      "src/cycle-a.js",
      "-va",
      "-j",
    ]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    const cycle = diags(report).find((d) => d.code === "CYCLE");
    assert.ok(cycle, `diagnostics=${JSON.stringify(diags(report))}`);
    assert.equal(cycle.severity, "error");
    assert.ok(Array.isArray(cycle.paths));
    assert.ok(cycle.paths.length >= 3);
    assert.equal(cycle.paths[0], cycle.paths[cycle.paths.length - 1]);
  });

  it("UNUSED_IMPORT for unused named import", async () => {
    const { code, stdout } = await runCli(["src/unused.js", "-va", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    const unusedImp = diags(report).find((d) => d.code === "UNUSED_IMPORT");
    assert.ok(unusedImp, `diagnostics=${JSON.stringify(diags(report))}`);
    assert.equal(unusedImp.severity, "warning");
    assert.match(String(unusedImp.source), /lib/);
  });

  it("UNUSED_EXPORT for export without consumers", async () => {
    const { code, stdout } = await runCli(["src/unused.js", "-va", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    const unusedExp = diags(report).find(
      (d) => d.code === "UNUSED_EXPORT" && d.name === "orphan",
    );
    assert.ok(unusedExp, `diagnostics=${JSON.stringify(diags(report))}`);
    const usedOk = diags(report).find(
      (d) => d.code === "UNUSED_EXPORT" && d.name === "used",
    );
    assert.equal(usedOk, undefined);
  });

  it("BROKEN_IMPORT for missing local file", async () => {
    const { code, stdout } = await runCli(["src/broken.js", "-va", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    const broken = diags(report).find((d) => d.code === "BROKEN_IMPORT");
    assert.ok(broken, `diagnostics=${JSON.stringify(diags(report))}`);
    assert.equal(broken.severity, "error");
    assert.match(String(broken.source), /missing/);
  });

  it("bare fs and side-effect import are not flagged", async () => {
    const { code, stdout } = await runCli([
      "src/sideeffect.js",
      "-va",
      "-j",
    ]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    const list = diags(report);
    assert.equal(
      list.filter((d) => d.code === "BROKEN_IMPORT").length,
      0,
      JSON.stringify(list),
    );
    assert.equal(
      list.filter((d) => d.code === "UNUSED_IMPORT").length,
      0,
      JSON.stringify(list),
    );
  });

  it("text schematic has diagnostics section only with -va", async () => {
    const withFlag = await runCli(["src/sideeffect.js", "-va"]);
    assert.match(withFlag.stdout, /┌─.*diagnostics/);

    const without = await runCli(["src/sideeffect.js", "-b"]);
    assert.doesNotMatch(without.stdout, /┌─.*diagnostics/);
  });

  it("help contains operations · s03", async () => {
    const { code, stdout } = await runCli(["--help"]);
    assert.equal(code, 0);
    assert.match(stdout, /operations · s03/);
    assert.match(stdout, /-va,\s*--validate/);
  });

  it("default-all does not include validate", async () => {
    const { stdout } = await runCli(["src/sideeffect.js", "-j"]);
    const report = JSON.parse(stdout);
    assert.equal(report.options.validate, false);
    assert.equal(report.results.validation, undefined);
  });
});
