/**
 * fix-imports — remove UNUSED_IMPORT; skip ambiguous BROKEN_IMPORT.
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
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
 * Remove import declarations whose source matches unused diagnostics.
 * @param {string} source
 * @param {object[]} unusedSources
 * @returns {string}
 */
function removeUnusedImports(source, unusedSources) {
  const want = new Set(unusedSources.map((s) => s ?? ""));
  const { ast } = parseWithComments(source);
  /** @type {{start:number,end:number}[]} */
  const ranges = [];
  for (const node of ast.body ?? []) {
    if (node.type !== "ImportDeclaration") continue;
    const src = node.source?.value;
    if (want.has(src)) {
      let end = node.end;
      if (source[end] === "\n") end += 1;
      ranges.push({ start: node.start, end });
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
 * @param {string} brokenSource
 * @param {string} targetPath
 * @returns {string|null} replacement specifier or null
 */
function uniqueLocalCandidate(brokenSource, targetPath) {
  if (!brokenSource || !brokenSource.startsWith(".")) return null;
  const dir = dirname(targetPath);
  const base = brokenSource.replace(/^\.\//, "").replace(/\.js$/, "");
  const candidates = [
    `./${base}.js`,
    `./${base}.mjs`,
    `./${base}.cjs`,
    `./${base}/index.js`,
  ];
  /** @type {string[]} */
  const found = [];
  for (const c of candidates) {
    const abs = join(dir, c);
    if (existsSync(abs)) found.push(c.startsWith(".") ? c : `./${c}`);
  }
  // also try sibling with different ext already covered
  if (found.length === 1) return found[0];
  return null;
}

/**
 * @param {string} source
 * @param {string} fromSpec
 * @param {string} toSpec
 */
function rewriteImportSpecifier(source, fromSpec, toSpec) {
  const { ast } = parseWithComments(source);
  let out = source;
  const nodes = [...(ast.body ?? [])]
    .filter((n) => n.type === "ImportDeclaration" && n.source?.value === fromSpec)
    .sort((a, b) => b.start - a.start);
  for (const node of nodes) {
    const lit = node.source;
    out = out.slice(0, lit.start) + JSON.stringify(toSpec) + out.slice(lit.end);
  }
  return out;
}

/**
 * @param {import('../../core/types.js').AnalysisContext} ctx
 * @param {object} results
 * @param {object} state
 */
export async function buildFixImportsChanges(ctx, results, state) {
  const path = ctx.targetPath;
  const display = displayPath(path, ctx.options.pathMode, ctx.cwd);
  /** @type {import('../types.js').Change[]} */
  const changes = [];

  let diagnostics;
  try {
    diagnostics = await ensureDiagnostics(ctx, results);
  } catch {
    return [
      makeUpdateChange({
        id: nextChangeId(state),
        path,
        display,
        op: "fix-imports",
        summary: "validation prerequisite failed",
        before: getWorkingText(state, path),
        after: getWorkingText(state, path),
        risk: "caution",
        skippedReason: "PARSE_FAILED",
      }),
    ];
  }

  let text = getWorkingText(state, path);
  const unused = diagnostics.filter((d) => d.code === "UNUSED_IMPORT");
  if (unused.length > 0) {
    const before = text;
    const after = removeUnusedImports(
      before,
      unused.map((d) => d.source),
    );
    if (after !== before) {
      text = after;
      setWorkingText(state, path, text);
      changes.push(
        makeUpdateChange({
          id: nextChangeId(state),
          path,
          display,
          op: "fix-imports",
          summary: `remove unused imports (${unused.length})`,
          before,
          after,
          risk: "caution",
          details: { refCodes: unused.map((d) => d.code) },
        }),
      );
    }
  }

  const broken = diagnostics.filter((d) => d.code === "BROKEN_IMPORT");
  for (const d of broken) {
    const candidate = uniqueLocalCandidate(d.source, path);
    if (!candidate) {
      changes.push(
        makeUpdateChange({
          id: nextChangeId(state),
          path,
          display,
          op: "fix-imports",
          summary: `skip broken import ${d.source}`,
          before: text,
          after: text,
          risk: "caution",
          skippedReason: "AMBIGUOUS_FIX",
          details: { refCode: "BROKEN_IMPORT", source: d.source },
        }),
      );
      continue;
    }
    const before = text;
    const after = rewriteImportSpecifier(before, d.source, candidate);
    if (after !== before) {
      text = after;
      setWorkingText(state, path, text);
      changes.push(
        makeUpdateChange({
          id: nextChangeId(state),
          path,
          display,
          op: "fix-imports",
          summary: `rewrite ${d.source} → ${candidate}`,
          before,
          after,
          risk: "caution",
          details: { refCode: "BROKEN_IMPORT", source: d.source, to: candidate },
        }),
      );
    }
  }

  return changes;
}

export const fixImportsOp = {
  id: "fix-imports",
  build: buildFixImportsChanges,
};
