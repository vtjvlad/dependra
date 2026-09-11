import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  ensureBuiltInBackends,
  getBackendForPath,
  listExtensions,
  loadSourceFile,
} from "../src/parsers/index.js";
import { analyze, registerBuiltins } from "../src/api/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "fixtures/jsx");

describe("JSX (.jsx) language support", () => {
  it("registers .jsx on javascript backend", () => {
    ensureBuiltInBackends();
    const backend = getBackendForPath(join(FIXTURE, "widget.jsx"));
    assert.equal(backend?.meta.id, "javascript");
    assert.ok(listExtensions().includes(".jsx"));
  });

  it("parses JSX without UNSUPPORTED_LANGUAGE", async () => {
    ensureBuiltInBackends();
    const sf = await loadSourceFile(join(FIXTURE, "widget.jsx"), FIXTURE);
    assert.equal(sf.language, "javascript");
    assert.ok(sf.ast);
  });

  it("basic + imports/exports + graph on widget.jsx", async () => {
    registerBuiltins();
    const { report, exitCode } = await analyze({
      targetPath: join(FIXTURE, "widget.jsx"),
      cwd: FIXTURE,
      options: {
        basic: true,
        imports: true,
        exports: true,
        graph: true,
        json: true,
        pathMode: "relative",
      },
    });
    assert.equal(exitCode, 0);
    const basic = report.results["basic-file-information"];
    assert.equal(basic.status, "ok");
    assert.equal(basic.data.language, "javascript");
    assert.equal(basic.data.format, "jsx");
    assert.equal(basic.data.engine, "node");

    const ie = report.results["import-export-analysis"];
    assert.equal(ie.status, "ok");
    const dep = ie.data.imports.find((i) => i.source === "./dep.js");
    assert.ok(dep?.resolvedPath?.endsWith("dep.js"));
    assert.ok(ie.data.exports.some((e) => e.name === "Widget" || e.kind === "default"));

    assert.equal(report.results["dependency-analysis"].status, "ok");
  });
});
