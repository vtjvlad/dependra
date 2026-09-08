import { getInspector } from "./registry.js";

/**
 * @typedef {import('./types.js').AnalysisContext} AnalysisContext
 * @typedef {import('./types.js').InspectorResult} InspectorResult
 * @typedef {import('./types.js').AnalysisReport} AnalysisReport
 */

const PACKAGE_VERSION = "0.0.1";

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
 * Оркестрация pipeline по docs/50-cli/interface.md.
 * Пока инспекторы не зарегистрированы (до MVP-005+), запрошенные секции
 * получают явный configuration-error — без пустых заглушек-модулей.
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

  if (needImportExport) {
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

  if (options.graph) {
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
