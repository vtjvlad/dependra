/**
 * Modification op registry.
 */

/** @type {Map<string, { id: string, build: Function }>} */
const ops = new Map();

/**
 * @param {{ id: string, build: (ctx: object, results: object, state: object) => Promise<import('./types.js').Change[]>|import('./types.js').Change[] }} op
 */
export function registerModificationOp(op) {
  ops.set(op.id, op);
}

/**
 * @param {string} id
 */
export function getModificationOp(id) {
  return ops.get(id);
}

/**
 * @returns {string[]}
 */
export function listModificationOpIds() {
  return [...ops.keys()];
}

/**
 * Fixed order per s07-flags.md.
 */
export const MODIFY_OP_ORDER = [
  "fix-imports",
  "fix-exports",
  "sort-imports",
  "strip-comments",
  "add-file-banner",
  "format",
  "install-deps",
  "ai-modify",
];
