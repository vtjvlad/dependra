/**
 * Bridge: TUI → public API only.
 */

import {
  analyze,
  applyLevel,
  applyProfile,
  emptyConfigModel,
  findProjectRoot,
  formatText,
  listOperations,
  loadMergedConfig,
  optionsFromKeys,
  OPERATION_KEYS,
  resolveProjectConfPath,
  resolveUserConfPath,
  saveConf,
  serializeConf,
} from "../api/index.js";

export {
  analyze,
  applyLevel,
  applyProfile,
  emptyConfigModel,
  findProjectRoot,
  formatText,
  listOperations,
  loadMergedConfig,
  optionsFromKeys,
  OPERATION_KEYS,
  resolveProjectConfPath,
  resolveUserConfPath,
  saveConf,
  serializeConf,
};

/**
 * Load merged config for a project root.
 * @param {string} projectRoot
 * @param {string} cwd
 */
export function loadSessionConfig(projectRoot, cwd) {
  return loadMergedConfig({
    targetPath: projectRoot,
    cwd,
  });
}

/**
 * Run analysis for selected file + operation keys.
 * @param {{
 *   targetPath: string,
 *   cwd: string,
 *   selectedKeys: string[],
 *   confModel?: object|null,
 *   applyMutate?: boolean,
 * }} opts
 */
export async function runAnalysis(opts) {
  const base = {
    pathMode: opts.confModel?.pathMode ?? "relative",
    report: opts.confModel?.report ?? null,
    ai: opts.confModel?.ai ?? null,
    apply: Boolean(opts.applyMutate),
    dryRun: !opts.applyMutate,
  };
  const options = optionsFromKeys(opts.selectedKeys, base);
  const result = await analyze({
    targetPath: opts.targetPath,
    cwd: opts.cwd,
    options,
  });
  const text = formatText(result.report, {
    report: options.report,
    color: false,
  });
  return { ...result, text };
}
