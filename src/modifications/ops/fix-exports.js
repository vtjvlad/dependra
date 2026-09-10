/**
 * fix-exports — remove UNUSED_EXPORT from target file.
 */

import { validationInspector } from "../../inspectors/validation.js";
import { importExportAnalysisInspector } from "../../inspectors/import-export-analysis.js";
import {
  displayPath,
  getWorkingText,
  makeUpdateChange,
  nextChangeId,
  parseWithComments,
  setWorkingText,
} from "./_helpers.js";

/**
 * @param {import('../../core/types.js').AnalysisContext} ctx
 * @param {object} results
 */
async function ensureDiagnostics(ctx, results) {
  if (results.validation?.status === "ok" && results.validation.data?.diagnostics) {
    return results.validation.data.diagnostics;
  }
  if (!Array.isArray(ctx.projectModel.imports)) {
    await importExportAnalysisInspector.analyze(ctx);
  }
  const vr = await validationInspector.analyze(ctx);
  if (vr.status !== "ok") return [];
  return vr.data?.diagnostics ?? [];
}

/**
 * @param {string} source
 * @param {Set<string>} unusedNames
 */
function removeUnusedExports(source, unusedNames) {
  const { ast } = parseWithComments(source);
  /** @type {{start:number,end:number}[]} */
  const ranges = [];

  for (const node of ast.body ?? []) {
    if (node.type === "ExportNamedDeclaration" && !node.source) {
      if (node.declaration) {
        const decl = node.declaration;
        /** @type {string[]} */
        let names = [];
        if (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") {
          if (decl.id?.name) names = [decl.id.name];
        } else if (decl.type === "VariableDeclaration") {
          for (const d of decl.declarations ?? []) {
            if (d.id?.type === "Identifier") names.push(d.id.name);
          }
        }
        if (names.length > 0 && names.every((n) => unusedNames.has(n))) {
          let end = node.end;
          if (source[end] === "\n") end += 1;
          ranges.push({ start: node.start, end });
        }
      } else if (node.specifiers?.length) {
        // export { a, b } — drop unused specs; if all unused, drop whole
        const keep = node.specifiers.filter(
          (s) => !unusedNames.has(s.exported?.name ?? s.local?.name),
        );
        if (keep.length === 0) {
          let end = node.end;
          if (source[end] === "\n") end += 1;
          ranges.push({ start: node.start, end });
        }
      }
    }
  }

  ranges.sort((a, b) => b.start - a.start);
  let out = source;
  for (const r of ranges) {
    out = out.slice(0, r.start) + out.slice(r.end);
  }
  return out;
}

/**
 * @param {import('../../core/types.js').AnalysisContext} ctx
 * @param {object} results
 * @param {object} state
 */
export async function buildFixExportsChanges(ctx, results, state) {
  const path = ctx.targetPath;
  const display = displayPath(path, ctx.options.pathMode, ctx.cwd);
  const diagnostics = await ensureDiagnostics(ctx, results);
  const unused = diagnostics.filter((d) => d.code === "UNUSED_EXPORT");
  if (unused.length === 0) return [];

  const names = new Set(unused.map((d) => d.name ?? d.display).filter(Boolean));
  const before = getWorkingText(state, path);
  let after;
  try {
    after = removeUnusedExports(before, names);
  } catch {
    return [
      makeUpdateChange({
        id: nextChangeId(state),
        path,
        display,
        op: "fix-exports",
        summary: "parse failed",
        before,
        after: before,
        risk: "caution",
        skippedReason: "PARSE_FAILED",
      }),
    ];
  }
  if (after === before) return [];
  setWorkingText(state, path, after);
  return [
    makeUpdateChange({
      id: nextChangeId(state),
      path,
      display,
      op: "fix-exports",
      summary: `remove unused exports (${names.size})`,
      before,
      after,
      risk: "caution",
      details: { names: [...names] },
    }),
  ];
}

export const fixExportsOp = {
  id: "fix-exports",
  build: buildFixExportsChanges,
};
