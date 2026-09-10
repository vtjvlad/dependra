import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseArgs } from "../src/cli/parse-args.js";

describe("parseArgs short flags", () => {
  it("-b -i -e -g -j match long forms", () => {
    const short = parseArgs(["file.js", "-b", "-i", "-e", "-g", "-j"]);
    const long = parseArgs([
      "file.js",
      "--basic",
      "--imports",
      "--exports",
      "--graph",
      "--json",
    ]);
    assert.equal(short.error, null);
    assert.deepEqual(short.options, long.options);
    assert.equal(short.targetPath, "file.js");
    assert.equal(short.options.basic, true);
    assert.equal(short.options.imports, true);
    assert.equal(short.options.exports, true);
    assert.equal(short.options.graph, true);
    assert.equal(short.options.json, true);
  });

  it("-p relative sets pathMode", () => {
    const parsed = parseArgs(["file.js", "-g", "-p", "relative"]);
    assert.equal(parsed.error, null);
    assert.equal(parsed.options.pathMode, "relative");
    assert.equal(parsed.options.graph, true);
  });

  it("-p without value errors", () => {
    const parsed = parseArgs(["file.js", "-p"]);
    assert.match(parsed.error ?? "", /path-mode/);
  });

  it("-h and -v without regression", () => {
    assert.equal(parseArgs(["-h"]).help, true);
    assert.equal(parseArgs(["-v"]).version, true);
  });

  it("unknown -x errors", () => {
    const parsed = parseArgs(["file.js", "-x"]);
    assert.equal(parsed.error, "Неизвестный флаг: -x");
  });

  it("-a and -en are S02 shorts; -e stays exports", () => {
    const a = parseArgs(["file.js", "-a"]);
    assert.equal(a.error, null);
    assert.equal(a.options.additional, true);
    assert.equal(a.options.basic, false);
    assert.equal(a.options.imports, false);
    assert.equal(a.options.entities, false);

    const en = parseArgs(["file.js", "-en"]);
    assert.equal(en.error, null);
    assert.equal(en.options.entities, true);
    assert.equal(en.options.exports, false);

    const both = parseArgs(["file.js", "-e", "-en"]);
    assert.equal(both.options.exports, true);
    assert.equal(both.options.entities, true);

    const long = parseArgs(["file.js", "--additional", "--entities"]);
    assert.equal(long.options.additional, true);
    assert.equal(long.options.entities, true);
  });

  it("default-all is S01 only without S02/S03 flags", () => {
    const parsed = parseArgs(["file.js"]);
    assert.equal(parsed.options.basic, true);
    assert.equal(parsed.options.graph, true);
    assert.equal(parsed.options.additional, false);
    assert.equal(parsed.options.entities, false);
    assert.equal(parsed.options.validate, false);
  });

  it("-va and --validate are S03 shorts; -v stays version", () => {
    const va = parseArgs(["file.js", "-va"]);
    assert.equal(va.error, null);
    assert.equal(va.options.validate, true);
    assert.equal(va.options.basic, false);
    assert.equal(va.version, false);

    const long = parseArgs(["file.js", "--validate"]);
    assert.equal(long.options.validate, true);
    assert.deepEqual(va.options, long.options);

    const ver = parseArgs(["-v"]);
    assert.equal(ver.version, true);
    assert.equal(ver.options.validate, false);
  });

  it("S04 shorts and default-all exclusion", () => {
    const parsed = parseArgs(["file.js"]);
    assert.equal(parsed.options.environment, false);
    assert.equal(parsed.options.commands, false);
    assert.equal(parsed.options.envCheck, false);
    assert.equal(parsed.options.runtime, false);
    assert.equal(parsed.options.io, false);
    assert.equal(parsed.options.basic, true);

    const env = parseArgs(["file.js", "-env"]);
    assert.equal(env.options.environment, true);
    assert.equal(env.options.basic, false);
    assert.equal(env.options.envCheck, false);

    const ec = parseArgs(["file.js", "-ec"]);
    assert.equal(ec.options.envCheck, true);
    assert.equal(ec.options.environment, false);

    const rest = parseArgs(["file.js", "-c", "-r", "-io"]);
    assert.equal(rest.options.commands, true);
    assert.equal(rest.options.runtime, true);
    assert.equal(rest.options.io, true);
    assert.equal(rest.options.basic, false);

    const longs = parseArgs([
      "file.js",
      "--environment",
      "--commands",
      "--env-check",
      "--runtime",
      "--io",
    ]);
    assert.equal(longs.options.environment, true);
    assert.equal(longs.options.commands, true);
    assert.equal(longs.options.envCheck, true);
    assert.equal(longs.options.runtime, true);
    assert.equal(longs.options.io, true);
  });

  it("S05 shorts and default-all exclusion", () => {
    const parsed = parseArgs(["file.js"]);
    assert.equal(parsed.options.mermaid, false);
    assert.equal(parsed.options.graphviz, false);
    assert.equal(parsed.options.vizJson, false);
    assert.equal(parsed.options.metadata, false);

    const m = parseArgs(["file.js", "-m"]);
    assert.equal(m.options.mermaid, true);
    assert.equal(m.options.basic, false);

    const me = parseArgs(["file.js", "-me"]);
    assert.equal(me.options.metadata, true);
    assert.equal(me.options.mermaid, false);

    const viz = parseArgs(["file.js", "-gr", "-vj"]);
    assert.equal(viz.options.graphviz, true);
    assert.equal(viz.options.vizJson, true);

    const level = parseArgs(["file.js", "-l", "3"]);
    assert.equal(level.levelArg, 3);
    assert.equal(level.options.level, 3);
  });

  it("S06 shorts and default-all exclusion", () => {
    const parsed = parseArgs(["file.js"]);
    assert.equal(parsed.options.quality, false);
    assert.equal(parsed.options.explain, false);

    const q = parseArgs(["file.js", "-q"]);
    assert.equal(q.options.quality, true);
    assert.equal(q.options.basic, false);

    const ex = parseArgs(["file.js", "-ex"]);
    assert.equal(ex.options.explain, true);
    assert.equal(ex.options.quality, false);

    const both = parseArgs(["file.js", "--quality", "--explain"]);
    assert.equal(both.options.quality, true);
    assert.equal(both.options.explain, true);
  });
});
