import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CLI = join(ROOT, "src/cli/index.js");
const FIXTURE = join(__dirname, "fixtures/s05");

/**
 * @param {string[]} args
 * @param {{ cwd?: string }} [opts]
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

describe("S05 CLI AC", () => {
  it("--mermaid/-m returns visualization formats.mermaid", async () => {
    const { code, stdout } = await runCli(["src/app.js", "--mermaid", "--json"]);
    assert.equal(code, 0, stdout + (await runCli(["src/app.js", "-m", "-j"])).stderr);
    const report = JSON.parse(stdout);
    assert.equal(report.options.mermaid, true);
    assert.ok(report.results.visualization);
    const fmt = report.results.visualization.data.formats;
    assert.ok(fmt.mermaid?.dependencyGraph);
    assert.ok(fmt.mermaid?.importTree);
    assert.ok(fmt.mermaid?.exportConsumers);
    assert.equal(fmt.graphviz, undefined);
  });

  it("-m short matches --mermaid", async () => {
    const short = JSON.parse(
      (await runCli(["src/app.js", "-m", "-j"])).stdout,
    );
    const long = JSON.parse(
      (await runCli(["src/app.js", "--mermaid", "--json"])).stdout,
    );
    assert.deepEqual(Object.keys(short.results), Object.keys(long.results));
  });

  it("--graphviz/-gr and --viz-json/-vj", async () => {
    const { code, stdout } = await runCli([
      "src/app.js",
      "-gr",
      "-vj",
      "-j",
    ]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.graphviz, true);
    assert.equal(report.options.vizJson, true);
    const fmt = report.results.visualization.data.formats;
    assert.ok(fmt.graphviz?.dependencyGraph.includes("digraph"));
    assert.ok(Array.isArray(fmt.json?.dependencyGraph?.nodes));
  });

  it("--metadata/-me extracts fs-extended and embedded-text", async () => {
    const { code, stdout } = await runCli(["src/app.js", "-me", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.metadata, true);
    const data = report.results.metadata.data;
    const ids = data.providers.map((p) => p.id);
    assert.ok(ids.includes("fs-extended"));
    assert.ok(ids.includes("embedded-text"));
    const emb = data.providers.find((p) => p.id === "embedded-text");
    assert.ok(emb.data.markers.some((m) => m.kind === "license"));
    assert.ok(
      data.skippedProviders.some(
        (s) => s.id === "exif" && s.reason === "unsupported-type",
      ),
    );
  });

  it("viz/metadata not in default-all", async () => {
    const { code, stdout } = await runCli(["src/app.js", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.mermaid, false);
    assert.equal(report.options.metadata, false);
    assert.ok(!report.results.visualization);
    assert.ok(!report.results.metadata);
    assert.ok(report.results["basic-file-information"]);
  });

  it("--level 1 only basic", async () => {
    const { code, stdout } = await runCli(["src/app.js", "-l", "1", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.level, 1);
    assert.equal(report.options.basic, true);
    assert.equal(report.options.imports, false);
    assert.deepEqual(Object.keys(report.results), ["basic-file-information"]);
  });

  it("--level 5 includes mermaid+metadata", async () => {
    const { code, stdout } = await runCli(["src/app.js", "-l", "5", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.mermaid, true);
    assert.equal(report.options.metadata, true);
    assert.ok(report.results.visualization);
    assert.ok(report.results.metadata);
  });

  it("--profile deps expands ops", async () => {
    const { code, stdout } = await runCli([
      "src/app.js",
      "--profile",
      "deps",
      "-j",
    ]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.profile, "deps");
    assert.equal(report.options.graph, true);
    assert.ok(report.results["dependency-analysis"]);
  });

  it("--config ops-graph.conf enables graph without -g", async () => {
    const { code, stdout } = await runCli([
      "src/app.js",
      "-cf",
      "ops-graph.conf",
      "-j",
    ]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.graph, true);
    assert.ok(report.results["dependency-analysis"]);
    assert.ok(String(report.options.configPath).endsWith("ops-graph.conf"));
  });

  it("flag alias --deps maps to --graph", async () => {
    const { code, stdout } = await runCli(["src/app.js", "--deps", "-j"]);
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.options.graph, true);
  });

  it("help includes s05 frames", async () => {
    const { code, stdout } = await runCli(["--help"]);
    assert.equal(code, 0);
    assert.match(stdout, /operations · s05/);
    assert.match(stdout, /config · s05/);
    assert.match(stdout, /--mermaid/);
    assert.match(stdout, /--level/);
  });

  it("text mermaid section without json", async () => {
    const { code, stdout } = await runCli(["src/app.js", "-m"]);
    assert.equal(code, 0);
    assert.match(stdout, /mermaid/);
    assert.match(stdout, /graph LR/);
  });
});
