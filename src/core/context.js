/**
 * @typedef {import('./types.js').AnalysisOptions} AnalysisOptions
 * @typedef {import('./types.js').AnalysisContext} AnalysisContext
 * @typedef {import('./types.js').ProjectModel} ProjectModel
 */

/**
 * @param {string} targetPath Абсолютный путь к целевому файлу
 * @param {string} cwd
 * @param {AnalysisOptions} options
 * @returns {AnalysisContext}
 */
export function createAnalysisContext(targetPath, cwd, options) {
  /** @type {ProjectModel} */
  const projectModel = {
    cwd,
    targetPath,
    files: {},
  };

  return {
    targetPath,
    cwd,
    projectModel,
    options,
  };
}
