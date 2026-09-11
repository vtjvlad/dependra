import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  ensureBuiltInBackends,
  getBackendForPath,
  listExtensions,
  loadSourceFile,
  registerBuiltInBackends,
} from "../src/parsers/index.js";
import { nullTreeSitterProvider } from "../src/parsers/providers/tree-sitter.js";
import { nullLspProvider } from "../src/parsers/providers/lsp.js";
import { analyze, registerBuiltins } from "../src/api/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "fixtures/s09");
const MVP = join(__dirname, "fixtures/mvp");

describe("S09 language-backend registry", () => {
  it("routes .ts to typescript and .js to javascript", () => {
    registerBuiltInBackends();
    const ts = getBackendForPath(join(FIXTURE, "value-imports.ts"));
    const js = getBackendForPath(join(MVP, "src/app.js"));
    assert.equal(ts?.meta.id, "typescript");
    assert.equal(js?.meta.id, "javascript");
    const exts = listExtensions();
    assert.ok(exts.includes(".ts"));
    assert.ok(exts.includes(".tsx"));
    assert.ok(exts.includes(".js"));
  });

  it("null providers are unavailable", () => {
    assert.equal(nullTreeSitterProvider.isAvailable(), false);
    assert.equal(nullLspProvider.isAvailable(), false);
  });

  it("parses .ts without UNSUPPORTED_LANGUAGE", async () => {
    ensureBuiltInBackends();
    const sf = await loadSourceFile(join(FIXTURE, "value-imports.ts"), FIXTURE);
    assert.equal(sf.language, "typescript");
    assert.ok(sf.ast);
  });

  it("parses .tsx with JSX", async () => {
    ensureBuiltInBackends();
    const sf = await loadSourceFile(join(FIXTURE, "mixed.tsx"), FIXTURE);
    assert.equal(sf.language, "typescript");
    assert.ok(sf.ast);
  });
});

describe("S09 analyze TypeScript", () => {
  it("basic + imports/exports on value-imports.ts", async () => {
    registerBuiltins();
    const { report, exitCode } = await analyze({
      targetPath: join(FIXTURE, "value-imports.ts"),
      cwd: FIXTURE,
      options: {
        basic: true,
        imports: true,
        exports: true,
        graph: false,
        json: true,
        pathMode: "relative",
      },
    });
    assert.equal(exitCode, 0);
    const basic = report.results["basic-file-information"];
    assert.equal(basic.status, "ok");
    assert.equal(basic.data.language, "typescript");
    assert.equal(basic.data.engine, "node");

    const ie = report.results["import-export-analysis"];
    assert.equal(ie.status, "ok");
    assert.equal(ie.data.moduleKind, "esm");
    const sources = ie.data.imports.map((i) => i.source);
    assert.ok(sources.includes("./util.js"));
    assert.ok(sources.includes("./shared"));
    const util = ie.data.imports.find((i) => i.source === "./util.js");
    assert.ok(util?.resolvedPath);
    const shared = ie.data.imports.find((i) => i.source === "./shared");
    assert.ok(shared?.resolvedPath?.endsWith("shared.ts"));
  });

  it("type-only imports set importKind without breaking schema", async () => {
    registerBuiltins();
    const { report, exitCode } = await analyze({
      targetPath: join(FIXTURE, "type-only.ts"),
      cwd: FIXTURE,
      options: {
        basic: false,
        imports: true,
        exports: true,
        graph: false,
        json: true,
        pathMode: "relative",
      },
    });
    assert.equal(exitCode, 0);
    const ie = report.results["import-export-analysis"];
    assert.equal(ie.status, "ok");
    const typeImp = ie.data.imports.find((i) => i.source === "./types");
    assert.ok(typeImp);
    assert.equal(typeImp.importKind, "type");
    const valueImp = ie.data.imports.find((i) => i.source === "./value-mod");
    assert.ok(valueImp);
    assert.equal(valueImp.importKind, undefined);
  });

  it("graph resolves TS↔TS and TS↔JS", async () => {
    registerBuiltins();
    const { report, exitCode } = await analyze({
      targetPath: join(FIXTURE, "graph/root.ts"),
      cwd: FIXTURE,
      options: {
        basic: false,
        imports: true,
        exports: false,
        graph: true,
        json: true,
        pathMode: "relative",
      },
    });
    assert.equal(exitCode, 0);
    const ie = report.results["import-export-analysis"];
    assert.equal(ie.status, "ok");
    const leaf = ie.data.imports.find((i) => i.source === "./leaf");
    const fromJs = ie.data.imports.find((i) => i.source === "./from-js.js");
    assert.ok(leaf?.resolvedPath?.endsWith("leaf.ts"));
    assert.ok(fromJs?.resolvedPath?.endsWith("from-js.js"));

    const graph = report.results["dependency-analysis"];
    assert.equal(graph.status, "ok");
  });

  it("JS regression smoke on mvp fixture", async () => {
    registerBuiltins();
    const { report, exitCode } = await analyze({
      targetPath: join(MVP, "src/app.js"),
      cwd: MVP,
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
    assert.equal(report.results["basic-file-information"].data.language, "javascript");
    assert.equal(report.results["import-export-analysis"].status, "ok");
    assert.equal(report.results["dependency-analysis"].status, "ok");
  });
});
