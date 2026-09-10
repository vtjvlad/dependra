/**
 * sort-imports op.
 */

import { builtinModules } from "node:module";
import {
  displayPath,
  getWorkingText,
  makeUpdateChange,
  nextChangeId,
  parseWithComments,
  setWorkingText,
} from "./_helpers.js";

const builtins = new Set(builtinModules.map((m) => m.replace(/^node:/, "")));

/**
 * @param {string} source
 * @returns {"side-effect"|"builtin"|"external"|"relative"}
 */
function importGroup(source) {
  if (!source) return "external";
  if (source.startsWith(".") || source.startsWith("/")) return "relative";
  const bare = source.replace(/^node:/, "").split("/")[0];
  if (builtins.has(bare) || source.startsWith("node:")) return "builtin";
  return "external";
}

const GROUP_ORDER = {
  "side-effect": 0,
  builtin: 1,
  external: 2,
  relative: 3,
};

/**
 * @param {string} source
 * @returns {string}
 */
export function sortImportsInSource(source) {
  const { ast } = parseWithComments(source);
  const body = ast.body ?? [];
  /** @type {object[]} */
  const imports = [];
  let endIndex = 0;
  for (let i = 0; i < body.length; i += 1) {
    if (body[i].type === "ImportDeclaration") {
      imports.push(body[i]);
      endIndex = i + 1;
    } else {
      break;
    }
  }
  if (imports.length <= 1) return source;

  const slices = imports.map((node) => ({
    node,
    text: source.slice(node.start, node.end),
    sideEffect: (node.specifiers?.length ?? 0) === 0,
    source: node.source?.value ?? "",
  }));

  slices.sort((a, b) => {
    const ga = a.sideEffect
      ? "side-effect"
      : importGroup(String(a.source));
    const gb = b.sideEffect
      ? "side-effect"
      : importGroup(String(b.source));
    const oa = GROUP_ORDER[ga];
    const ob = GROUP_ORDER[gb];
    if (oa !== ob) return oa - ob;
    return String(a.source).localeCompare(String(b.source));
  });

  const start = imports[0].start;
  const end = imports[imports.length - 1].end;
  const rebuilt = slices.map((s) => s.text).join("\n");
  return source.slice(0, start) + rebuilt + source.slice(end);
}

/**
 * @param {import('../../core/types.js').AnalysisContext} ctx
 * @param {object} _results
 * @param {object} state
 */
export function buildSortImportsChanges(ctx, _results, state) {
  const path = ctx.targetPath;
  const before = getWorkingText(state, path);
  let after;
  try {
    after = sortImportsInSource(before);
  } catch {
    return [
      makeUpdateChange({
        id: nextChangeId(state),
        path,
        display: displayPath(path, ctx.options.pathMode, ctx.cwd),
        op: "sort-imports",
        summary: "parse failed",
        before,
        after: before,
        risk: "safe",
        skippedReason: "PARSE_FAILED",
      }),
    ];
  }
  if (before === after) return [];
  setWorkingText(state, path, after);
  return [
    makeUpdateChange({
      id: nextChangeId(state),
      path,
      display: displayPath(path, ctx.options.pathMode, ctx.cwd),
      op: "sort-imports",
      summary: "sort import blocks",
      before,
      after,
      risk: "safe",
    }),
  ];
}

export const sortImportsOp = {
  id: "sort-imports",
  build: buildSortImportsChanges,
};
