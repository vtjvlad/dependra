import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseConf } from "../src/config/parse-conf.js";
import {
  applyLevel,
  buildAliasMap,
  normalizeConfData,
} from "../src/config/index.js";
import { operationsForLevel } from "../src/config/levels.js";

describe("config .conf parser", () => {
  it("parses sections, bools, lists, comments", () => {
    const raw = `
# comment
pathMode = relative
strict = false

[operations]
graph = true

[report]
sectionOrder = file, imports, graph
hideSections =

[flags.aliases]
--graph = --deps, -D

[ai]
enabled = false
apiKeyEnv = DEPENDRA_AI_API_KEY
`;
    const parsed = parseConf(raw);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.data.pathMode, "relative");
    assert.equal(parsed.data.operations.graph, true);
    assert.deepEqual(parsed.data.report.sectionOrder, [
      "file",
      "imports",
      "graph",
    ]);
    assert.deepEqual(parsed.data.flags.aliases["--graph"], ["--deps", "-D"]);
    assert.equal(parsed.data.ai.apiKeyEnv, "DEPENDRA_AI_API_KEY");
  });

  it("rejects apiKey in file", () => {
    const parsed = parseConf("[ai]\napiKey = secret\n");
    assert.equal(parsed.ok, false);
    assert.match(parsed.error.message, /Секреты/);
  });

  it("normalize + level 3 ops", () => {
    const norm = normalizeConfData({
      operations: { basic: true },
    });
    assert.equal(norm.ok, true);
    const leveled = applyLevel(norm.model, 3);
    assert.equal(leveled.ok, true);
    assert.equal(leveled.model.operations.imports, true);
    assert.equal(leveled.model.operations.graph, true);
    assert.equal(leveled.model.operations.validate, false);
  });

  it("level 5 includes mermaid+metadata", () => {
    const ops = operationsForLevel(5);
    assert.ok(ops.includes("mermaid"));
    assert.ok(ops.includes("metadata"));
  });

  it("alias map conflict errors", () => {
    const built = buildAliasMap({
      aliases: {
        "--graph": ["--deps"],
        "--validate": ["--deps"],
      },
      rename: {},
      disable: [],
    });
    assert.equal(built.ok, false);
  });
});
