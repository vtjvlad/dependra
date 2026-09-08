/**
 * Общие JSDoc-типы ядра (контракт см. docs/20-architecture/inspector-contract.md).
 *
 * @typedef {object} AnalysisOptions
 * @property {boolean} basic
 * @property {boolean} imports
 * @property {boolean} exports
 * @property {boolean} graph
 * @property {boolean} json
 * @property {"name"|"relative"|"absolute"} pathMode
 *
 * @typedef {object} ProjectModel
 * @property {string} cwd
 * @property {string} targetPath
 * @property {Object.<string, object>} files
 * @property {object[]} [imports]
 * @property {object[]} [exports]
 * @property {object[]} [edges]
 *
 * @typedef {object} AnalysisContext
 * @property {string} targetPath
 * @property {string} cwd
 * @property {ProjectModel} projectModel
 * @property {AnalysisOptions} options
 *
 * @typedef {object} InspectorMeta
 * @property {string} id
 * @property {string} version
 * @property {string[]} tags
 *
 * @typedef {object} InspectorError
 * @property {"validation"|"execution"|"dependency"|"configuration"|"compatibility"|"internal"} category
 * @property {string} code
 * @property {string} message
 * @property {boolean} retryable
 * @property {object} [details]
 *
 * @typedef {object} InspectorResult
 * @property {string} inspectorId
 * @property {"ok"|"error"} status
 * @property {object} [data]
 * @property {InspectorError} [error]
 *
 * @typedef {object} Inspector
 * @property {InspectorMeta} meta
 * @property {(ctx: AnalysisContext) => Promise<InspectorResult>} analyze
 *
 * @typedef {object} AnalysisReport
 * @property {string} version
 * @property {string} target
 * @property {string} cwd
 * @property {object} options
 * @property {Object.<string, InspectorResult>} results
 * @property {string[]} [prerequisiteErrors]
 */

export {};
