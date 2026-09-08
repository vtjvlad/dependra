import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { createAnalysisContext, runPipeline } from "../src/core/index.js";
import { dependencyAnalysisInspector } from "../src/inspectors/dependency-analysis.js";
import { registerBuiltInInspectors } from "../src/inspectors/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "fixtures/mvp");
const APP = join(FIXTURE, "src/app.js");
const DYN = join(FIXTURE, "src/dyn.js");

registerBuiltInInspectors();

describe("MVP inspectors unit", () => {
  it("MODEL_INCOMPLETE without prepared imports", async () => {
    const ctx = createAnalysisContext(APP, FIXTURE, {
      basic: false,
      imports: false,
      exports: false,
      graph: true,
      json: true,
      pathMode: "relative",
    });
    const result = await dependencyAnalysisInspector.analyze(ctx);
    assert.equal(result.status, "error");
    assert.equal(result.error?.code, "MODEL_INCOMPLETE");
  });

  it("dynamic import(expr) yields source null without failing analysis", async () => {
    const ctx = createAnalysisContext(DYN, FIXTURE, {
      basic: false,
      imports: true,
      exports: false,
      graph: false,
      json: true,
      pathMode: "relative",
    });
    const { report, exitCode } = await runPipeline(ctx);
    assert.equal(exitCode, 0);
    const imports = report.results["import-export-analysis"].data.imports;
    assert.ok(imports.some((i) => i.kind === "dynamic" && i.source === null));
    assert.ok(imports.some((i) => i.source === "./lib.js"));
  });

  it("pipeline default-all includes three inspector keys", async () => {
    const ctx = createAnalysisContext(APP, FIXTURE, {
      basic: true,
      imports: true,
      exports: true,
      graph: true,
      json: true,
      pathMode: "relative",
    });
    const { report, exitCode } = await runPipeline(ctx);
    assert.equal(exitCode, 0);
    assert.ok(report.results["basic-file-information"]);
    assert.ok(report.results["import-export-analysis"]);
    assert.ok(report.results["dependency-analysis"]);
  });
});
