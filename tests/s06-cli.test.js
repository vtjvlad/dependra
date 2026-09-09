import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { parseArgs } from "../src/cli/parse-args.js";
import { operationsForLevel } from "../src/config/levels.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CLI = join(ROOT, "src/cli/index.js");
const FIXTURE = join(__dirname, "fixtures/s06");

/**
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv }} [opts]
 */
function runCli(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: opts.cwd ?? FIXTURE,
      env: { ...process.env, NO_COLOR: "1", ...(opts.env ?? {}) },
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

describe("S06 parse-args", () => {
  it("-q / --quality and -ex / --explain", () => {
    const q = parseArgs(["f.js", "-q"]);
    assert.equal(q.options.quality, true);
    assert.equal(q.options.explain, false);
    assert.equal(q.sawAnyOp, true);

    const ex = parseArgs(["f.js", "-ex"]);
    assert.equal(ex.options.explain, true);
    assert.equal(ex.sawAnyOp, true);

    const def = parseArgs(["f.js"]);
    assert.equal(def.options.quality, false);
    assert.equal(def.options.explain, false);
    assert.equal(def.options.basic, true);
  });
});

describe("S06 levels", () => {
  it("level 4 includes quality, not explain", () => {
    const ops = operationsForLevel(4);
    assert.ok(ops.includes("quality"));
    assert.ok(ops.includes("validate"));
    assert.ok(!ops.includes("explain"));
  });

  it("level 5 includes quality + mermaid", () => {
    const ops = operationsForLevel(5);
    assert.ok(ops.includes("quality"));
    assert.ok(ops.includes("mermaid"));
  });
});

describe("S06 CLI AC", () => {
  it("--quality/-q returns code-quality-analysis with metrics/findings", async () => {
    const { code, stdout, stderr } = await runCli([
      "src/app.js",
      "--quality",
      "--json",
    ]);
    assert.equal(code, 0, stderr + stdout);
    const report = JSON.parse(stdout);
    assert.equal(report.options.quality, true);
    assert.equal(report.options.explain, false);
    const data = report.results["code-quality-analysis"].data;
    assert.ok(data.metrics);
    assert.ok(data.scores);
    assert.equal(data.scores.method, "heuristic-s06");
    assert.ok(Array.isArray(data.findings));
    const codes = data.findings.map((f) => f.code);
    assert.ok(codes.includes("UNUSED_LOCAL"));
    assert.ok(codes.includes("SUSPICIOUS_EVAL"));
    assert.ok(codes.includes("EXCESS_BLANK"));
    assert.ok(codes.includes("DUPLICATE_BLOCK"));
    assert.ok(!codes.includes("CYCLE"));
    assert.ok(!codes.includes("UNUSED_IMPORT"));
    // _unused param must not appear
    const unusedNames = data.findings
      .filter((f) => f.code === "UNUSED_LOCAL")
      .map((f) => f.name);
    assert.ok(!unusedNames.includes("_unused"));
  });

  it("-q short matches --quality", async () => {
    const short = JSON.parse(
      (await runCli(["src/app.js", "-q", "-j"])).stdout,
    );
    const long = JSON.parse(
      (await runCli(["src/app.js", "--quality", "--json"])).stdout,
    );
    assert.deepEqual(Object.keys(short.results), Object.keys(long.results));
  });

  it("default-all does not include quality/explain", async () => {
    const { code, stdout } = await runCli(["src/app.js", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.quality, false);
    assert.equal(report.options.explain, false);
    assert.equal(report.results["code-quality-analysis"], undefined);
    assert.equal(report.results["ai-explain"], undefined);
  });

  it("-ex OR-includes quality; AI off → skipped ai-disabled", async () => {
    const { code, stdout, stderr } = await runCli(
      ["src/app.js", "-ex", "-j", "-cf", "ai-off.conf"],
      {},
    );
    assert.equal(code, 0, stderr + stdout);
    const report = JSON.parse(stdout);
    assert.equal(report.options.explain, true);
    assert.equal(report.options.quality, true);
    assert.ok(report.results["code-quality-analysis"]);
    const ai = report.results["ai-explain"].data;
    assert.equal(ai.skipped, true);
    assert.equal(ai.skipReason, "ai-disabled");
  });

  it("-ex with mock provider returns explanations", async () => {
    const { code, stdout, stderr } = await runCli([
      "src/app.js",
      "-ex",
      "-j",
      "-cf",
      "ai-mock.conf",
    ]);
    assert.equal(code, 0, stderr + stdout);
    const report = JSON.parse(stdout);
    assert.ok(report.results["code-quality-analysis"]);
    const ai = report.results["ai-explain"].data;
    assert.equal(ai.skipped, false);
    assert.equal(ai.provider, "mock");
    assert.ok(ai.explanations.length > 0);
    assert.ok(ai.explanations[0].summary);
    assert.ok(ai.explanations[0].detail);
  });

  it("--level 4 includes quality, not explain", async () => {
    const { code, stdout, stderr } = await runCli([
      "src/app.js",
      "-l",
      "4",
      "-j",
      "-cf",
      "ai-off.conf",
    ]);
    assert.equal(code, 0, stderr + stdout);
    const report = JSON.parse(stdout);
    assert.equal(report.options.quality, true);
    assert.equal(report.options.explain, false);
    assert.ok(report.results["code-quality-analysis"]);
    assert.equal(report.results["ai-explain"], undefined);
  });

  it("text section quality appears for -q", async () => {
    const { code, stdout } = await runCli(["src/app.js", "-q"]);
    assert.equal(code, 0);
    assert.match(stdout, /quality/i);
    assert.match(stdout, /UNUSED_LOCAL|SUSPICIOUS_EVAL|scores/i);
  });
});
