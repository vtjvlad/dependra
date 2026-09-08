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

  it("default-all is S01 only without S02 flags", () => {
    const parsed = parseArgs(["file.js"]);
    assert.equal(parsed.options.basic, true);
    assert.equal(parsed.options.graph, true);
    assert.equal(parsed.options.additional, false);
    assert.equal(parsed.options.entities, false);
  });
});
