/**
 * Уровни анализа → набор operations (docs/40-development/analysis-levels.md).
 * Инспекторы не читают level — только CLI/config layer.
 */

/** @type {Record<number, string[]>} */
export const LEVEL_OPERATIONS = {
  1: ["basic"],
  2: ["basic", "additional", "environment"],
  3: [
    "basic",
    "additional",
    "environment",
    "imports",
    "exports",
    "graph",
  ],
  4: [
    "basic",
    "additional",
    "environment",
    "imports",
    "exports",
    "graph",
    "entities",
    "validate",
    "quality",
  ],
  5: [
    "basic",
    "additional",
    "environment",
    "imports",
    "exports",
    "graph",
    "entities",
    "validate",
    "quality",
    "mermaid",
    "metadata",
  ],
};

/**
 * @param {number} level
 * @returns {string[]|null}
 */
export function operationsForLevel(level) {
  if (!Number.isInteger(level) || level < 1 || level > 5) return null;
  return LEVEL_OPERATIONS[level];
}
