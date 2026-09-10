/**
 * Реестр инспекторов. Инспекторы регистрируются по мере появления (MVP-005+).
 */

/** @typedef {import('./types.js').Inspector} Inspector */

/** @type {Map<string, Inspector>} */
const inspectors = new Map();

/**
 * @param {Inspector} inspector
 */
export function registerInspector(inspector) {
  if (!inspector?.meta?.id || typeof inspector.analyze !== "function") {
    throw new Error("Invalid inspector: meta.id and analyze() required");
  }
  inspectors.set(inspector.meta.id, inspector);
}

/**
 * @param {string} id
 * @returns {Inspector|undefined}
 */
export function getInspector(id) {
  return inspectors.get(id);
}

/**
 * @returns {string[]}
 */
export function listInspectorIds() {
  return [...inspectors.keys()];
}
