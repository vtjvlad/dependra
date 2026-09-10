/**
 * Safety mode + selective apply (docs/20-features/modifications/safety.md).
 */

/**
 * @param {import('../core/types.js').AnalysisOptions} options
 * @returns {"preview"|"dry-run"|"apply"}
 */
export function resolveModificationMode(options) {
  if (options.dryRun) return "dry-run";
  if (options.apply) return "apply";
  return "preview";
}

/**
 * @param {import('./types.js').Change[]} changes
 * @param {string[]|null|undefined} changeIds
 * @returns {import('./types.js').Change[]}
 */
export function applySelectiveFilter(changes, changeIds) {
  if (!changeIds || changeIds.length === 0) {
    return changes.map((c) => ({
      ...c,
      selected: c.selected !== false && !c.skippedReason,
    }));
  }
  const want = new Set(changeIds);
  return changes.map((c) => ({
    ...c,
    selected: want.has(c.id) && !c.skippedReason,
  }));
}

/**
 * @param {import('./types.js').Change[]} changes
 * @returns {import('./types.js').ModificationReport["summary"]}
 */
export function emptySummary(changes = []) {
  /** @type {Object.<string, number>} */
  const byOp = {};
  for (const c of changes) {
    byOp[c.op] = (byOp[c.op] ?? 0) + 1;
  }
  return {
    proposed: changes.length,
    applied: 0,
    failed: 0,
    byOp,
  };
}

/**
 * Есть ли mutate-op (не safety-only флаги).
 * @param {import('../core/types.js').AnalysisOptions} options
 * @returns {boolean}
 */
export function hasMutateOp(options) {
  return Boolean(
    options.format ||
      options.sortImports ||
      options.fixImports ||
      options.fixExports ||
      options.stripComments ||
      options.commentBanner ||
      options.installDeps ||
      options.aiModify ||
      (options.installPackage && String(options.installPackage).length > 0),
  );
}
