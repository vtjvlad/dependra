import { basename, dirname, relative } from "node:path";
import { loadSourceFile, ParserError } from "../parsers/index.js";
import { extractImportExport } from "./import-export-analysis.js";
import { findProjectRoot, listJavaScriptFiles } from "./scan-js-files.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

/**
 * @param {string|null} absPath
 * @param {string} fallbackDisplay
 * @param {"name"|"relative"|"absolute"} pathMode
 * @param {string} cwd
 * @returns {string}
 */
function formatDisplay(absPath, fallbackDisplay, pathMode, cwd) {
  if (!absPath) return fallbackDisplay;
  if (pathMode === "name") return basename(absPath);
  if (pathMode === "absolute") return absPath;
  const rel = relative(cwd, absPath);
  return rel.startsWith("..") ? absPath : rel;
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  if (!Array.isArray(ctx.projectModel.imports)) {
    return {
      inspectorId: "dependency-analysis",
      status: "error",
      error: {
        category: "configuration",
        code: "MODEL_INCOMPLETE",
        message:
          "В модели нет подготовленных imports (нужен prerequisite import-export-analysis)",
        retryable: false,
      },
    };
  }

  const pathMode = ctx.options.pathMode ?? "relative";
  const targetPath = ctx.targetPath;
  const cwd = ctx.cwd;

  /** @type {{ display: string, path: string|null, isExternal: boolean }[]} */
  const importsCol = ctx.projectModel.imports.map((imp) => {
    if (imp.isExternal) {
      return {
        display: imp.source ?? "(external)",
        path: null,
        isExternal: true,
      };
    }
    if (!imp.resolvedPath) {
      return {
        display: imp.source ?? "(dynamic)",
        path: null,
        isExternal: false,
      };
    }
    return {
      display: formatDisplay(imp.resolvedPath, imp.source, pathMode, cwd),
      path: imp.resolvedPath,
      isExternal: false,
    };
  });

  /** @type {string[]} */
  const skipped = [];
  /** @type {{ display: string, path: string }[]} */
  const importedBy = [];

  let root;
  try {
    root = findProjectRoot(dirname(targetPath), cwd);
  } catch (err) {
    return {
      inspectorId: "dependency-analysis",
      status: "error",
      error: {
        category: "execution",
        code: "SCAN_FAILED",
        message: "Не удалось определить корень проекта",
        retryable: false,
        details: {
          cause: err instanceof Error ? err.message : String(err),
        },
      },
    };
  }

  let candidates;
  try {
    candidates = listJavaScriptFiles(root);
  } catch (err) {
    return {
      inspectorId: "dependency-analysis",
      status: "error",
      error: {
        category: "execution",
        code: "SCAN_FAILED",
        message: `Сбой обхода корня: ${root}`,
        retryable: false,
        details: {
          root,
          cause: err instanceof Error ? err.message : String(err),
        },
      },
    };
  }

  for (const candidate of candidates) {
    if (candidate === targetPath) continue;
    try {
      const sf = await loadSourceFile(candidate, cwd);
      const { imports } = extractImportExport(sf.ast, candidate);
      const hits = imports.some(
        (imp) => imp.resolvedPath && imp.resolvedPath === targetPath,
      );
      if (hits) {
        importedBy.push({
          display: formatDisplay(candidate, candidate, pathMode, cwd),
          path: candidate,
        });
      }
    } catch (err) {
      if (err instanceof ParserError) {
        skipped.push(candidate);
        continue;
      }
      skipped.push(candidate);
    }
  }

  importedBy.sort((a, b) => a.display.localeCompare(b.display));

  const data = {
    pathMode,
    importedBy,
    imports: importsCol,
  };

  if (skipped.length > 0) {
    data.details = { skipped };
  }

  ctx.projectModel.edges = [
    ...importsCol.map((row) => ({
      from: targetPath,
      to: row.path ?? row.display,
      direction: "imports",
    })),
    ...importedBy.map((row) => ({
      from: row.path,
      to: targetPath,
      direction: "imported-by",
    })),
  ];

  return {
    inspectorId: "dependency-analysis",
    status: "ok",
    data,
  };
}

/** @type {Inspector} */
export const dependencyAnalysisInspector = {
  meta: {
    id: "dependency-analysis",
    version: "0.0.1",
    tags: ["M"],
  },
  analyze,
};
