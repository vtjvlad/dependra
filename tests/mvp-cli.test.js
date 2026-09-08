import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CLI = join(ROOT, "src/cli/index.js");
const FIXTURE = join(ROOT, "tests/fixtures/mvp");
const APP = join(FIXTURE, "src/app.js");
const CJS = join(FIXTURE, "src/cjs-sample.cjs");

/**
 * @param {string[]} args
 * @param {{ cwd?: string }} [opts]
 * @returns {Promise<{ code: number|null, stdout: string, stderr: string }>}
 */
function runCli(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: opts.cwd ?? FIXTURE,
      env: process.env,
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

describe("MVP CLI AC", () => {
  it("--version prints 0.0.1", async () => {
    const { code, stdout } = await runCli(["--version"]);
    assert.equal(code, 0);
    assert.equal(stdout.trim(), "0.0.1");
  });

  it("missing file exits 1", async () => {
    const { code } = await runCli(["no-such-file.js"]);
    assert.equal(code, 1);
  });

  it("unknown flag exits 1", async () => {
    const { code, stderr } = await runCli([APP, "--level"]);
    assert.equal(code, 1);
    assert.match(stderr, /Неизвестный флаг/);
  });

  it("--basic --json returns all BasicFileInfo fields", async () => {
    const { code, stdout } = await runCli([APP, "--basic", "--json"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.version, "0.0.1");
    const data = report.results["basic-file-information"].data;
    for (const key of [
      "name",
      "ext",
      "format",
      "mimeType",
      "size",
      "createdAt",
      "modifiedAt",
      "accessedAt",
      "owner",
      "group",
      "language",
      "engine",
      "fileType",
    ]) {
      assert.ok(key in data, `missing ${key}`);
    }
    assert.equal(data.language, "javascript");
    assert.equal(data.mimeType, "text/javascript");
    assert.equal(data.engine, "node");
  });

  it("--imports/--exports filter data and share one inspector key", async () => {
    const onlyImports = JSON.parse(
      (await runCli([APP, "--imports", "--json"])).stdout,
    );
    const onlyExports = JSON.parse(
      (await runCli([APP, "--exports", "--json"])).stdout,
    );
    const both = JSON.parse(
      (await runCli([APP, "--imports", "--exports", "--json"])).stdout,
    );

    const ieIn = onlyImports.results["import-export-analysis"].data;
    assert.ok(ieIn.imports);
    assert.equal("exports" in ieIn, false);

    const ieEx = onlyExports.results["import-export-analysis"].data;
    assert.ok(ieEx.exports);
    assert.equal("imports" in ieEx, false);

    const ieBoth = both.results["import-export-analysis"].data;
    assert.ok(ieBoth.imports && ieBoth.exports);
    assert.equal(ieBoth.moduleKind, "esm");
    assert.ok(ieBoth.imports.some((i) => i.source === "fs" && i.isExternal));
    assert.ok(
      ieBoth.imports.some(
        (i) => i.source === "./lib.js" && i.resolvedPath?.endsWith("lib.js"),
      ),
    );
  });

  it("CJS require and commonjs exports", async () => {
    const { code, stdout } = await runCli([CJS, "--imports", "--exports", "--json"]);
    assert.equal(code, 0);
    const data = JSON.parse(stdout).results["import-export-analysis"].data;
    assert.equal(data.moduleKind, "cjs");
    assert.ok(data.imports.some((i) => i.kind === "require" && i.source === "path"));
    assert.ok(data.exports.some((e) => e.kind === "commonjs"));
  });

  it("--graph alone has dependency-analysis only and reverse edge", async () => {
    const { code, stdout } = await runCli([
      "src/app.js",
      "--graph",
      "--json",
      "--path-mode",
      "relative",
    ]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.deepEqual(Object.keys(report.results), ["dependency-analysis"]);
    const data = report.results["dependency-analysis"].data;
    assert.equal(data.pathMode, "relative");
    assert.ok(data.imports.some((i) => i.isExternal && i.display === "fs"));
    assert.ok(data.imports.some((i) => i.display === "src/lib.js" || i.display.endsWith("lib.js")));
    assert.ok(
      data.importedBy.some(
        (i) => i.display === "src/main.js" || i.path?.endsWith("main.js"),
      ),
      `importedBy=${JSON.stringify(data.importedBy)}`,
    );
  });

  it("pathMode name|absolute work", async () => {
    const nameReport = JSON.parse(
      (
        await runCli(["src/app.js", "--graph", "--json", "--path-mode", "name"])
      ).stdout,
    );
    const absReport = JSON.parse(
      (
        await runCli([
          "src/app.js",
          "--graph",
          "--json",
          "--path-mode",
          "absolute",
        ])
      ).stdout,
    );
    const nameData = nameReport.results["dependency-analysis"].data;
    const absData = absReport.results["dependency-analysis"].data;
    assert.ok(nameData.imports.some((i) => !i.isExternal && i.display === "lib.js"));
    assert.ok(
      absData.imports.some(
        (i) => !i.isExternal && i.path?.endsWith("lib.js") && i.display === i.path,
      ),
    );
  });

  it("text report has # graph columns", async () => {
    const { code, stdout } = await runCli(["src/app.js", "--graph"]);
    assert.equal(code, 0);
    assert.match(stdout, /# graph/);
    assert.match(stdout, /imported-by/);
    assert.match(stdout, /imports/);
  });

  it("json stdout is valid even with stderr diagnostics unused", async () => {
    const { code, stdout, stderr } = await runCli([
      "src/app.js",
      "--basic",
      "--json",
    ]);
    assert.equal(code, 0);
    assert.equal(stderr, "");
    const report = JSON.parse(stdout);
    assert.equal(report.version, "0.0.1");
  });
});
