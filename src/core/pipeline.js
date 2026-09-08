import { getInspector } from "./registry.js";
import { ensureTargetSourceFile, ParserError } from "../parsers/index.js";
import { PACKAGE_VERSION } from "../version.js";

/**
 * @typedef {import('./types.js').AnalysisContext} AnalysisContext
 * @typedef {import('./types.js').InspectorResult} InspectorResult
 * @typedef {import('./types.js').AnalysisReport} AnalysisReport
 */

const ID_BASIC = "basic-file-information";
const ID_IMPORT_EXPORT = "import-export-analysis";
const ID_DEPENDENCY = "dependency-analysis";

/**
 * @param {string} id
 * @param {string} message
 * @returns {InspectorResult}
 */
function missingInspectorResult(id, message) {
  return {
    inspectorId: id,
    status: "error",
    error: {
      category: "configuration",
      code: "INSPECTOR_NOT_REGISTERED",
      message,
      retryable: false,
    },
  };
}

/**
 * @param {string} id
 * @param {ParserError} err
 * @returns {InspectorResult}
 */
function parserErrorResult(id, err) {
  return {
    inspectorId: id,
    status: "error",
    error: {
      category: err.category,
      code: err.code,
      message: err.message,
      retryable: false,
      details: err.details,
    },
  };
}

/**
 * Оркестрация pipeline по docs/50-cli/interface.md.
 *
 * @param {AnalysisContext} ctx
 * @returns {Promise<{ report: AnalysisReport, exitCode: number, prerequisiteErrors: string[] }>}
 */
export async function runPipeline(ctx) {
  const { options } = ctx;
  /** @type {Object.<string, InspectorResult>} */
  const results = {};
  /** @type {string[]} */
  const prerequisiteErrors = [];

  const needImportExport =
    options.imports || options.exports || options.graph;
  const reportImportExport = options.imports || options.exports;

  if (options.basic) {
    const inspector = getInspector(ID_BASIC);
    if (!inspector) {
      results[ID_BASIC] = missingInspectorResult(
        ID_BASIC,
        `Инспектор "${ID_BASIC}" ещё не зарегистрирован`,
      );
    } else {
      results[ID_BASIC] = await inspector.analyze(ctx);
    }
  }

  /** @type {InspectorResult|undefined} */
  let importExportResult;
  /** @type {ParserError|null} */
  let loadError = null;

  if (needImportExport) {
    try {
      await ensureTargetSourceFile(ctx);
    } catch (err) {
      if (err instanceof ParserError) {
        loadError = err;
      } else {
        throw err;
      }
    }
  }

  if (needImportExport) {
    if (loadError) {
      importExportResult = parserErrorResult(ID_IMPORT_EXPORT, loadError);
      if (reportImportExport) {
        results[ID_IMPORT_EXPORT] = importExportResult;
      } else if (options.graph) {
        prerequisiteErrors.push(
          `${ID_IMPORT_EXPORT}: ${loadError.message}`,
        );
      }
    } else {
      const inspector = getInspector(ID_IMPORT_EXPORT);
      if (!inspector) {
        importExportResult = missingInspectorResult(
          ID_IMPORT_EXPORT,
          `Инспектор "${ID_IMPORT_EXPORT}" ещё не зарегистрирован`,
        );
        if (reportImportExport) {
          results[ID_IMPORT_EXPORT] = importExportResult;
        } else if (options.graph) {
          prerequisiteErrors.push(
            `${ID_IMPORT_EXPORT}: ${importExportResult.error?.message ?? "missing"}`,
          );
        }
      } else {
        importExportResult = await inspector.analyze(ctx);
        if (reportImportExport) {
          const data = importExportResult.data
            ? { ...importExportResult.data }
            : undefined;
          if (data && importExportResult.status === "ok") {
            if (!options.imports) delete data.imports;
            if (!options.exports) delete data.exports;
          }
          results[ID_IMPORT_EXPORT] = {
            ...importExportResult,
            data,
          };
        } else if (
          options.graph &&
          importExportResult.status === "error"
        ) {
          prerequisiteErrors.push(
            `${ID_IMPORT_EXPORT}: ${importExportResult.error?.message ?? "error"}`,
          );
        }
      }
    }
  }

  if (options.graph) {
    if (loadError) {
      results[ID_DEPENDENCY] = parserErrorResult(ID_DEPENDENCY, loadError);
    } else {
      const inspector = getInspector(ID_DEPENDENCY);
      if (!inspector) {
        results[ID_DEPENDENCY] = missingInspectorResult(
          ID_DEPENDENCY,
          `Инспектор "${ID_DEPENDENCY}" ещё не зарегистрирован`,
        );
      } else {
        results[ID_DEPENDENCY] = await inspector.analyze(ctx);
      }
    }
  }

  /** @type {AnalysisReport} */
  const report = {
    version: PACKAGE_VERSION,
    target: ctx.targetPath,
    cwd: ctx.cwd,
    options: {
      basic: options.basic,
      imports: options.imports,
      exports: options.exports,
      graph: options.graph,
      pathMode: options.pathMode,
    },
    results,
  };

  if (prerequisiteErrors.length > 0) {
    report.prerequisiteErrors = prerequisiteErrors;
  }

  const hasResultError = Object.values(results).some(
    (r) => r.status === "error",
  );
  let exitCode = 0;
  if (hasResultError || prerequisiteErrors.length > 0) {
    exitCode = 2;
  }

  return { report, exitCode, prerequisiteErrors };
}
