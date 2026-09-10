/**
 * JSDoc types for S07 modifications (docs/20-features/modifications/safety.md).
 *
 * @typedef {"create"|"update"|"delete"|"rename"|"exec"} ChangeKind
 *
 * @typedef {object} Change
 * @property {string} id
 * @property {ChangeKind} kind
 * @property {string} path
 * @property {string} [display]
 * @property {string} op
 * @property {string} summary
 * @property {string} [before]
 * @property {string} [after]
 * @property {string} [diff]
 * @property {{ startLine?: number, endLine?: number }|null} [loc]
 * @property {boolean} [selected]
 * @property {"safe"|"caution"|"dangerous"} risk
 * @property {object} [details]
 * @property {string} [skippedReason]
 *
 * @typedef {object} ModificationReport
 * @property {"preview"|"dry-run"|"apply"|"undo"} mode
 * @property {Change[]} changes
 * @property {string[]} appliedIds
 * @property {string[]} skippedIds
 * @property {{ sessionId: string, dir: string, createdAt: string }|null} backup
 * @property {{ proposed: number, applied: number, failed: number, byOp: Object.<string, number> }} summary
 * @property {string} [errorCode]
 * @property {string} [errorMessage]
 */

export {};
