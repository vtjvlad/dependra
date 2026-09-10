import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CLI = join(ROOT, "src/cli/index.js");
const FIXTURE = join(__dirname, "fixtures/s04");

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

describe("S04 CLI AC", () => {
  it("--environment/-env returns symlink scripts entryPoints", async () => {
    const { code, stdout } = await runCli([
      "src/app.js",
      "--environment",
      "--json",
    ]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.environment, true);
    assert.deepEqual(Object.keys(report.results), [
      "file-environment-analysis",
    ]);
    const data = report.results["file-environment-analysis"].data;
    assert.equal(typeof data.symlink?.isSymlink, "boolean");
    assert.ok(typeof data.hardLink?.nlink === "number");
    assert.ok(
      data.entryPoints.some(
        (e) => e.kind === "package-main" || e.kind === "package-bin",
      ),
      JSON.stringify(data.entryPoints),
    );
    assert.ok(
      data.scripts.some((s) => String(s.display).includes("run-app")),
      JSON.stringify(data.scripts),
    );
  });

  it("-env short matches --environment", async () => {
    const short = JSON.parse(
      (await runCli(["src/app.js", "-env", "-j"])).stdout,
    );
    const long = JSON.parse(
      (await runCli(["src/app.js", "--environment", "--json"])).stdout,
    );
    assert.deepEqual(Object.keys(short.results), Object.keys(long.results));
  });

  it("--commands/-c lists utils without node/python", async () => {
    const { code, stdout } = await runCli(["src/app.js", "-c", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.commands, true);
    const cmds = report.results.commands.data.commands;
    assert.ok(cmds.some((c) => c.name === "cat"));
    assert.ok(cmds.some((c) => c.name === "stat"));
    assert.ok(!cmds.some((c) => c.name === "node"));
    assert.ok(!cmds.some((c) => c.name === "python"));
    assert.ok(cmds.some((c) => c.available === true));
  });

  it("--env-check/-ec includes node and npm from lockfile", async () => {
    const { code, stdout } = await runCli(["src/app.js", "-ec", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.envCheck, true);
    const data = report.results["environment-validation"].data;
    assert.ok(data.tools.some((t) => t.name === "node" && t.required));
    assert.ok(data.tools.some((t) => t.name === "npm" && t.required));
    assert.ok(Array.isArray(data.missing));
    for (const name of data.missing) {
      const t = data.tools.find((x) => x.name === name);
      assert.ok(t?.required && !t.available);
    }
  });

  it("-env and -ec are distinct options", async () => {
    const envOnly = JSON.parse(
      (await runCli(["src/app.js", "-env", "-j"])).stdout,
    );
    const ecOnly = JSON.parse(
      (await runCli(["src/app.js", "-ec", "-j"])).stdout,
    );
    assert.equal(envOnly.options.environment, true);
    assert.equal(envOnly.options.envCheck, false);
    assert.equal(ecOnly.options.envCheck, true);
    assert.equal(ecOnly.options.environment, false);
  });

  it("--runtime/-r returns node interpreter for JS", async () => {
    const { code, stdout } = await runCli(["src/app.js", "-r", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.runtime, true);
    const data = report.results["runtime-dependency-analysis"].data;
    assert.equal(data.language, "javascript");
    assert.equal(data.runtime?.kind, "interpreter");
    assert.equal(data.runtime?.name, "node");
    assert.match(String(data.runtime?.commandHint), /node/);
    assert.ok(
      data.runtime?.shebang == null ||
        String(data.runtime.shebang).includes("node"),
    );
  });

  it("--io/-io detects read write delete", async () => {
    const { code, stdout } = await runCli(["src/io-sample.js", "-io", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.io, true);
    const data = report.results["file-operations"].data;
    assert.ok(data.operations.some((o) => o.kind === "read"));
    assert.ok(data.operations.some((o) => o.kind === "write"));
    assert.ok(data.operations.some((o) => o.kind === "delete"));
    assert.ok(
      data.operations.some(
        (o) => o.kind === "write" && o.pathLiteral == null,
      ),
      "dynamic path should yield null pathLiteral",
    );
  });

  it("text schematic sections only with flags", async () => {
    const all = await runCli([
      "src/app.js",
      "-env",
      "-c",
      "-ec",
      "-r",
    ]);
    assert.match(all.stdout, /┌─.*environment/);
    assert.match(all.stdout, /┌─.*commands/);
    assert.match(all.stdout, /┌─.*env-check/);
    assert.match(all.stdout, /┌─.*runtime/);

    const io = await runCli(["src/io-sample.js", "-io"]);
    assert.match(io.stdout, /┌─.*io/);

    const basic = await runCli(["src/app.js", "-b"]);
    assert.doesNotMatch(basic.stdout, /┌─.*environment/);
    assert.doesNotMatch(basic.stdout, /┌─.*commands/);
  });

  it("help contains operations · s04", async () => {
    const { code, stdout } = await runCli(["--help"]);
    assert.equal(code, 0);
    assert.match(stdout, /operations · s04/);
    assert.match(stdout, /-env,\s*--environment/);
    assert.match(stdout, /-ec,\s*--env-check/);
    assert.match(stdout, /-io,\s*--io/);
  });

  it("default-all does not include S04", async () => {
    const { stdout } = await runCli(["src/app.js", "-j"]);
    const report = JSON.parse(stdout);
    assert.equal(report.options.environment, false);
    assert.equal(report.options.commands, false);
    assert.equal(report.options.envCheck, false);
    assert.equal(report.options.runtime, false);
    assert.equal(report.options.io, false);
    assert.equal(report.results["file-environment-analysis"], undefined);
  });
});
