/**
 * Public API surface for CLI, TUI, and future library/REST/IDE clients.
 * @see docs/20-architecture/public-api.md
 */

import { createAnalysisContext, runPipeline } from "../core/index.js";
import {
  OPERATION_KEYS,
  applyLevel,
  applyProfile,
  emptyConfigModel,
  loadConfFile,
  loadMergedConfig,
  normalizeConfData,
  resolveProjectConfPath,
  resolveUserConfPath,
  saveConf,
  serializeConf,
} from "../config/index.js";
import { registerBuiltInInspectors } from "../inspectors/index.js";
import { findProjectRoot } from "../inspectors/scan-js-files.js";
import {
  hasMutateOp,
  resolveModificationMode,
  runUndo,
} from "../modifications/index.js";
import { formatReport, formatTextReport } from "../reporters/index.js";

let builtinsRegistered = false;

/**
 * Register built-in inspectors (idempotent).
 */
export function registerBuiltins() {
  if (builtinsRegistered) return;
  registerBuiltInInspectors();
  builtinsRegistered = true;
}

/**
 * @typedef {object} OperationInfo
 * @property {string} key
 * @property {string} label
 * @property {"analysis"|"mutate"|"ai"} group
 */

/** @type {OperationInfo[]} */
const OPERATION_CATALOG = [
  { key: "basic", label: "Basic file information", group: "analysis" },
  { key: "imports", label: "Imports", group: "analysis" },
  { key: "exports", label: "Exports", group: "analysis" },
  { key: "graph", label: "Dependency graph", group: "analysis" },
  { key: "additional", label: "Additional file info", group: "analysis" },
  { key: "entities", label: "Exported entities", group: "analysis" },
  { key: "validate", label: "Validation", group: "analysis" },
  { key: "environment", label: "File environment", group: "analysis" },
  { key: "commands", label: "Commands", group: "analysis" },
  { key: "envCheck", label: "Environment validation", group: "analysis" },
  { key: "runtime", label: "Runtime dependencies", group: "analysis" },
  { key: "io", label: "File I/O operations", group: "analysis" },
  { key: "mermaid", label: "Mermaid visualization", group: "analysis" },
  { key: "graphviz", label: "Graphviz visualization", group: "analysis" },
  { key: "vizJson", label: "Viz JSON", group: "analysis" },
  { key: "metadata", label: "Metadata", group: "analysis" },
  { key: "quality", label: "Code quality", group: "analysis" },
  { key: "explain", label: "AI explain", group: "ai" },
  { key: "format", label: "Format code", group: "mutate" },
  { key: "sortImports", label: "Sort imports", group: "mutate" },
  { key: "fixImports", label: "Fix imports", group: "mutate" },
  { key: "fixExports", label: "Fix exports", group: "mutate" },
  { key: "stripComments", label: "Strip comments", group: "mutate" },
  { key: "commentBanner", label: "Add file banner", group: "mutate" },
  { key: "installDeps", label: "Install dependencies", group: "mutate" },
  { key: "aiModify", label: "AI modify", group: "mutate" },
];

/**
 * Catalog of operations for TUI picker / library clients.
 * @returns {OperationInfo[]}
 */
export function listOperations() {
  return OPERATION_CATALOG.map((o) => ({ ...o }));
}

/**
 * Empty analysis options (all ops false).
 * @returns {import('../core/types.js').AnalysisOptions}
 */
export function emptyOptions() {
  return {
    basic: false,
    imports: false,
    exports: false,
    graph: false,
    additional: false,
    entities: false,
    validate: false,
    environment: false,
    commands: false,
    envCheck: false,
    runtime: false,
    io: false,
    mermaid: false,
    graphviz: false,
    vizJson: false,
    metadata: false,
    quality: false,
    explain: false,
    format: false,
    sortImports: false,
    fixImports: false,
    fixExports: false,
    stripComments: false,
    commentBanner: false,
    installDeps: false,
    aiModify: false,
    apply: false,
    dryRun: false,
    backup: false,
    noBackup: false,
    undo: false,
    undoSession: null,
    changeIds: [],
    pm: null,
    installPackage: null,
    aimInstruction: null,
    json: false,
    pathMode: "relative",
    level: null,
    profile: null,
    configPath: null,
    report: null,
    ai: null,
  };
}

/**
 * Build options from selected operation keys + defaults.
 * @param {string[]} selectedKeys
 * @param {object} [base]
 * @returns {import('../core/types.js').AnalysisOptions}
 */
export function optionsFromKeys(selectedKeys, base = {}) {
  const options = { ...emptyOptions(), ...base };
  const keys = selectedKeys ?? [];
  if (keys.length === 0) {
    options.basic = true;
    options.imports = true;
    options.exports = true;
    options.graph = true;
    return options;
  }
  for (const key of keys) {
    if (key in options && typeof options[key] === "boolean") {
      options[key] = true;
    }
  }
  if (hasMutateOp(options) && !options.apply && !options.dryRun) {
    options.dryRun = true;
  }
  return options;
}

/**
 * Run analysis pipeline.
 * @param {{
 *   targetPath: string,
 *   cwd?: string,
 *   options?: import('../core/types.js').AnalysisOptions,
 * }} opts
 * @returns {Promise<{ report: object, exitCode: number, prerequisiteErrors: string[] }>}
 */
export async function analyze(opts) {
  registerBuiltins();
  const cwd = opts.cwd ?? process.cwd();
  const options = { ...emptyOptions(), ...(opts.options ?? {}) };
  const ctx = createAnalysisContext(opts.targetPath, cwd, options);
  return runPipeline(ctx);
}

/**
 * Format report as text (or JSON if opts.json).
 * @param {object} report
 * @param {{ json?: boolean, report?: object, color?: boolean }} [opts]
 * @returns {string}
 */
export function formatText(report, opts = {}) {
  if (opts.json) {
    return formatReport(report, { json: true, report: opts.report });
  }
  return formatTextReport(report, {
    report: opts.report,
    color: opts.color === true,
  });
}

export {
  OPERATION_KEYS,
  emptyConfigModel,
  loadConfFile,
  loadMergedConfig,
  normalizeConfData,
  applyProfile,
  applyLevel,
  serializeConf,
  saveConf,
  resolveUserConfPath,
  resolveProjectConfPath,
  findProjectRoot,
  hasMutateOp,
  resolveModificationMode,
  runUndo,
  formatReport,
  formatTextReport,
};
