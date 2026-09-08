import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CLI = join(ROOT, "src/cli/index.js");
const FIXTURE = join(__dirname, "fixtures/s02");
const SYMBOLS = join(FIXTURE, "src/symbols.js");

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

describe("S02 CLI AC", () => {
  it("--additional/-a returns paths permissions copies", async () => {
    const { code, stdout } = await runCli([
      "src/symbols.js",
      "--additional",
      "--json",
    ]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.additional, true);
    assert.equal(report.options.entities, false);
    assert.deepEqual(Object.keys(report.results), [
      "additional-file-information",
    ]);
    const data = report.results["additional-file-information"].data;
    assert.ok(data.absolutePath.endsWith("symbols.js"));
    assert.ok(data.relativePath.includes("symbols.js"));
    assert.ok(data.permissions?.modeString);
    assert.ok(data.permissions?.modeOctal);
    assert.ok(data.privilegeHints?.read);
    assert.ok(
      data.copies.some(
        (c) =>
          c.path?.endsWith("symbols.copy.js") &&
          typeof c.score === "number" &&
          c.score >= 0.75,
      ),
      `copies=${JSON.stringify(data.copies)}`,
    );
  });

  it("-a short matches --additional", async () => {
    const short = JSON.parse(
      (await runCli(["src/symbols.js", "-a", "-j"])).stdout,
    );
    const long = JSON.parse(
      (await runCli(["src/symbols.js", "--additional", "--json"])).stdout,
    );
    assert.deepEqual(
      Object.keys(short.results),
      Object.keys(long.results),
    );
  });

  it("--entities/-en lists exported and imported symbols", async () => {
    const { code, stdout } = await runCli([
      "src/symbols.js",
      "--entities",
      "--json",
    ]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.entities, true);
    assert.deepEqual(Object.keys(report.results), ["exported-entities"]);
    const data = report.results["exported-entities"].data;
    assert.ok(data.exported.some((e) => e.kind === "function" && e.name === "run"));
    assert.ok(data.exported.some((e) => e.kind === "class" && e.name === "App"));
    assert.ok(
      data.exported.some((e) => e.kind === "variable" && e.name === "VERSION"),
    );
    assert.ok(data.exported.some((e) => e.name === "default"));
    assert.ok(
      data.imported.some(
        (i) => i.name === "helper" && i.from === "./lib.js",
      ),
    );
  });

  it("-en pathMode name|absolute changes imported display", async () => {
    const nameReport = JSON.parse(
      (
        await runCli([
          "src/symbols.js",
          "-en",
          "-j",
          "-p",
          "name",
        ])
      ).stdout,
    );
    const absReport = JSON.parse(
      (
        await runCli([
          "src/symbols.js",
          "-en",
          "-j",
          "-p",
          "absolute",
        ])
      ).stdout,
    );
    const nameImp = nameReport.results["exported-entities"].data.imported.find(
      (i) => i.name === "helper",
    );
    const absImp = absReport.results["exported-entities"].data.imported.find(
      (i) => i.name === "helper",
    );
    assert.equal(nameImp.display, "helper");
    assert.ok(absImp.display.endsWith("lib.js"));
    assert.equal(absImp.display, absImp.resolvedPath);
  });

  it("text schematic has additional and entities sections", async () => {
    const add = await runCli(["src/symbols.js", "-a"]);
    assert.equal(add.code, 0);
    assert.match(add.stdout, /┌─.*additional/);
    assert.match(add.stdout, /copies/);

    const ent = await runCli(["src/symbols.js", "-en"]);
    assert.equal(ent.code, 0);
    assert.match(ent.stdout, /┌─.*entities/);
    assert.match(ent.stdout, /export/);
  });

  it("help lists operations · s02", async () => {
    const { code, stdout } = await runCli(["--help"]);
    assert.equal(code, 0);
    assert.match(stdout, /operations · s02/);
    assert.match(stdout, /-a, --additional/);
    assert.match(stdout, /-en, --entities/);
  });

  it("only -a does not include S01 inspector keys", async () => {
    const report = JSON.parse(
      (await runCli([SYMBOLS, "-a", "-j"], { cwd: ROOT })).stdout,
    );
    assert.equal("basic-file-information" in report.results, false);
    assert.equal("dependency-analysis" in report.results, false);
    assert.ok(report.results["additional-file-information"]);
  });
});
