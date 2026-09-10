import { getInspector } from "./registry.js";
import { ensureTargetSourceFile, ParserError } from "../parsers/index.js";
import { runAiExplain } from "../ai/explain.js";
import { hasMutateOp, runModifications } from "../modifications/index.js";
import { PACKAGE_VERSION } from "../version.js";

/**
 * @typedef {import('./types.js').AnalysisContext} AnalysisContext
 * @typedef {import('./types.js').InspectorResult} InspectorResult
 * @typedef {import('./types.js').AnalysisReport} AnalysisReport
 */

const ID_BASIC = "basic-file-information";
const ID_IMPORT_EXPORT = "import-export-analysis";
const ID_DEPENDENCY = "dependency-analysis";
const ID_ADDITIONAL = "additional-file-information";
const ID_ENTITIES = "exported-entities";
const ID_VALIDATION = "validation";
const ID_ENVIRONMENT = "file-environment-analysis";
const ID_COMMANDS = "commands";
const ID_ENV_CHECK = "environment-validation";
const ID_RUNTIME = "runtime-dependency-analysis";
const ID_IO = "file-operations";
const ID_VISUALIZATION = "visualization";
const ID_METADATA = "metadata";
const ID_QUALITY = "code-quality-analysis";
const ID_AI_EXPLAIN = "ai-explain";

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
 * @param {string} id
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function runInspector(id, ctx) {
  const inspector = getInspector(id);
  if (!inspector) {
    return missingInspectorResult(
      id,
      `Инспектор "${id}" ещё не зарегистрирован`,
    );
  }
  return inspector.analyze(ctx);
}

/**
 * Оркестрация pipeline по docs/50-cli/interface.md + s02–s04-flags.md.
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
    options.imports ||
    options.exports ||
    options.graph ||
    options.validate ||
    options.mermaid ||
    options.graphviz ||
    options.vizJson ||
    options.fixImports ||
    options.fixExports;
  const reportImportExport = options.imports || options.exports;
  const needAst = needImportExport || options.entities || options.io;
  const needViz =
    options.mermaid || options.graphviz || options.vizJson;

  if (options.basic) {
    results[ID_BASIC] = await runInspector(ID_BASIC, ctx);
  }

  /** @type {InspectorResult|undefined} */
  let importExportResult;
  /** @type {ParserError|null} */
  let loadError = null;

  if (needAst) {
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
      } else if (options.graph || options.validate || needViz || options.fixImports || options.fixExports) {
        prerequisiteErrors.push(
          `${ID_IMPORT_EXPORT}: ${loadError.message}`,
        );
      }
    } else {
      importExportResult = await runInspector(ID_IMPORT_EXPORT, ctx);
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
        (options.graph || options.validate || needViz || options.fixImports || options.fixExports) &&
        importExportResult.status === "error"
      ) {
        prerequisiteErrors.push(
          `${ID_IMPORT_EXPORT}: ${importExportResult.error?.message ?? "error"}`,
        );
      }
    }
  }

  if (options.graph) {
    if (loadError) {
      results[ID_DEPENDENCY] = parserErrorResult(ID_DEPENDENCY, loadError);
    } else {
      results[ID_DEPENDENCY] = await runInspector(ID_DEPENDENCY, ctx);
    }
  }

  if (options.additional) {
    results[ID_ADDITIONAL] = await runInspector(ID_ADDITIONAL, ctx);
  }

  if (options.entities) {
    if (loadError) {
      results[ID_ENTITIES] = parserErrorResult(ID_ENTITIES, loadError);
      prerequisiteErrors.push(`${ID_ENTITIES}: ${loadError.message}`);
    } else {
      results[ID_ENTITIES] = await runInspector(ID_ENTITIES, ctx);
    }
  }

  if (options.validate) {
    if (loadError) {
      results[ID_VALIDATION] = parserErrorResult(ID_VALIDATION, loadError);
      prerequisiteErrors.push(`${ID_VALIDATION}: ${loadError.message}`);
    } else {
      results[ID_VALIDATION] = await runInspector(ID_VALIDATION, ctx);
    }
  }

  if (options.environment) {
    results[ID_ENVIRONMENT] = await runInspector(ID_ENVIRONMENT, ctx);
  }

  if (options.commands) {
    results[ID_COMMANDS] = await runInspector(ID_COMMANDS, ctx);
  }

  if (options.envCheck) {
    results[ID_ENV_CHECK] = await runInspector(ID_ENV_CHECK, ctx);
  }

  if (options.runtime) {
    results[ID_RUNTIME] = await runInspector(ID_RUNTIME, ctx);
  }

  if (options.io) {
    if (loadError) {
      results[ID_IO] = parserErrorResult(ID_IO, loadError);
      prerequisiteErrors.push(`${ID_IO}: ${loadError.message}`);
    } else {
      results[ID_IO] = await runInspector(ID_IO, ctx);
    }
  }

  if (needViz) {
    if (loadError) {
      results[ID_VISUALIZATION] = parserErrorResult(
        ID_VISUALIZATION,
        loadError,
      );
      prerequisiteErrors.push(`${ID_VISUALIZATION}: ${loadError.message}`);
    } else {
      results[ID_VISUALIZATION] = await runInspector(ID_VISUALIZATION, ctx);
    }
  }

  if (options.metadata) {
    results[ID_METADATA] = await runInspector(ID_METADATA, ctx);
  }

  if (options.quality) {
    results[ID_QUALITY] = await runInspector(ID_QUALITY, ctx);
  }

  if (options.explain) {
    results[ID_AI_EXPLAIN] = await runAiExplain(ctx, results);
  }

  const wantModification =
    hasMutateOp(options) ||
    options.undo ||
    options.apply ||
    options.dryRun ||
    options.backup;

  if (wantModification) {
    results.modification = await runModifications(ctx, results);
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
      additional: Boolean(options.additional),
      entities: Boolean(options.entities),
      validate: Boolean(options.validate),
      environment: Boolean(options.environment),
      commands: Boolean(options.commands),
      envCheck: Boolean(options.envCheck),
      runtime: Boolean(options.runtime),
      io: Boolean(options.io),
      mermaid: Boolean(options.mermaid),
      graphviz: Boolean(options.graphviz),
      vizJson: Boolean(options.vizJson),
      metadata: Boolean(options.metadata),
      quality: Boolean(options.quality),
      explain: Boolean(options.explain),
      format: Boolean(options.format),
      sortImports: Boolean(options.sortImports),
      fixImports: Boolean(options.fixImports),
      fixExports: Boolean(options.fixExports),
      stripComments: Boolean(options.stripComments),
      commentBanner: Boolean(options.commentBanner),
      installDeps: Boolean(options.installDeps),
      aiModify: Boolean(options.aiModify),
      apply: Boolean(options.apply),
      dryRun: Boolean(options.dryRun),
      backup: Boolean(options.backup),
      noBackup: Boolean(options.noBackup),
      undo: Boolean(options.undo),
      pathMode: options.pathMode,
      level: options.level ?? null,
      profile: options.profile ?? null,
      configPath: options.configPath ?? null,
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
