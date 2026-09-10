/**
 * S07 modifications pass — build Changes then preview/apply/undo.
 */

import { dirname } from "node:path";
import { findProjectRoot } from "../inspectors/scan-js-files.js";
import { applyChanges } from "./apply.js";
import { createBackupSession, writeSessionManifest } from "./backup.js";
import {
  MODIFY_OP_ORDER,
  getModificationOp,
  registerModificationOp,
} from "./registry.js";
import {
  applySelectiveFilter,
  emptySummary,
  hasMutateOp,
  resolveModificationMode,
} from "./safety.js";
import { runUndo } from "./undo.js";

import { fixImportsOp } from "./ops/fix-imports.js";
import { fixExportsOp } from "./ops/fix-exports.js";
import { sortImportsOp } from "./ops/sort-imports.js";
import { stripCommentsOp } from "./ops/strip-comments.js";
import { addFileBannerOp } from "./ops/add-file-banner.js";
import { formatOp } from "./ops/format.js";
import { installDepsOp } from "./ops/install-deps.js";
import { aiModifyOp } from "./ops/ai-modify.js";

let registered = false;
function ensureOps() {
  if (registered) return;
  for (const op of [
    fixImportsOp,
    fixExportsOp,
    sortImportsOp,
    stripCommentsOp,
    addFileBannerOp,
    formatOp,
    installDepsOp,
    aiModifyOp,
  ]) {
    registerModificationOp(op);
  }
  registered = true;
}

/**
 * Map options → op ids to run.
 * @param {import('../core/types.js').AnalysisOptions} options
 * @returns {string[]}
 */
function selectedOpIds(options) {
  /** @type {string[]} */
  const ids = [];
  if (options.fixImports) ids.push("fix-imports");
  if (options.fixExports) ids.push("fix-exports");
  if (options.sortImports) ids.push("sort-imports");
  if (options.stripComments) ids.push("strip-comments");
  if (options.commentBanner) ids.push("add-file-banner");
  if (options.format) ids.push("format");
  if (options.installDeps || options.installPackage) ids.push("install-deps");
  if (options.aiModify) ids.push("ai-modify");
  return MODIFY_OP_ORDER.filter((id) => ids.includes(id));
}

/**
 * @param {import('../core/types.js').AnalysisContext} ctx
 * @param {object} results
 * @param {{ execRunner?: Function }} [hooks]
 * @returns {Promise<import('../core/types.js').InspectorResult>}
 */
export async function runModifications(ctx, results, hooks = {}) {
  ensureOps();
  const options = ctx.options;

  if (options.undo) {
    const root = findProjectRoot(
      ctx.targetPath ? dirname(ctx.targetPath) : ctx.cwd,
      ctx.cwd,
    );
    const undone = runUndo(root, options.undoSession ?? null);
    if (!undone.ok) {
      return {
        inspectorId: "modification",
        status: "error",
        error: {
          category: "execution",
          code: undone.code,
          message: undone.message,
          retryable: false,
        },
      };
    }
    return {
      inspectorId: "modification",
      status: "ok",
      data: undone.report,
    };
  }

  if (!hasMutateOp(options)) {
    if (options.apply || options.dryRun || options.backup) {
      return {
        inspectorId: "modification",
        status: "error",
        error: {
          category: "validation",
          code: "NO_MUTATE_OPS",
          message: "--apply/--dry-run без mutate-operation",
          retryable: false,
        },
      };
    }
    return {
      inspectorId: "modification",
      status: "ok",
      data: {
        mode: "preview",
        changes: [],
        appliedIds: [],
        skippedIds: [],
        backup: null,
        summary: emptySummary([]),
      },
    };
  }

  const mode = resolveModificationMode(options);
  /** @type {object} */
  const state = { texts: {}, _cid: 0 };
  /** @type {import('./types.js').Change[]} */
  let changes = [];

  for (const id of selectedOpIds(options)) {
    const op = getModificationOp(id);
    if (!op) continue;
    const built = await op.build(ctx, results, state);
    if (Array.isArray(built) && built.length) {
      changes = changes.concat(built);
    }
  }

  changes = applySelectiveFilter(changes, options.changeIds);
  const summary = emptySummary(changes);

  /** @type {import('./types.js').ModificationReport} */
  const report = {
    mode,
    changes,
    appliedIds: [],
    skippedIds: [],
    backup: null,
    summary,
  };

  if (mode === "preview" || mode === "dry-run") {
    report.skippedIds = changes.map((c) => c.id);
    return { inspectorId: "modification", status: "ok", data: report };
  }

  // apply — coalesce update/create per path to last selected change
  const projectRoot = findProjectRoot(dirname(ctx.targetPath), ctx.cwd);

  /** @type {import('./types.js').Change[]} */
  const applyList = [];
  /** @type {Map<string, import('./types.js').Change>} */
  const lastUpdateByPath = new Map();
  /** @type {Map<string, string[]>} */
  const updateIdsByPath = new Map();

  for (const c of changes) {
    if (!c.selected || c.skippedReason) continue;
    if (c.kind === "update" || c.kind === "create") {
      lastUpdateByPath.set(c.path, c);
      const ids = updateIdsByPath.get(c.path) ?? [];
      ids.push(c.id);
      updateIdsByPath.set(c.path, ids);
    } else {
      applyList.push(c);
    }
  }
  for (const c of lastUpdateByPath.values()) applyList.push(c);

  if (!options.noBackup) {
    const session = createBackupSession(projectRoot);
    writeSessionManifest(session, projectRoot, applyList, {
      argvSummary: "dependra --apply",
    });
    report.backup = {
      sessionId: session.sessionId,
      dir: session.dir,
      createdAt: session.createdAt,
    };
  }

  const applied = applyChanges(applyList, hooks);
  /** @type {string[]} */
  const appliedIds = [...applied.appliedIds];
  for (const [path, ids] of updateIdsByPath) {
    const last = lastUpdateByPath.get(path);
    if (last && applied.appliedIds.includes(last.id)) {
      for (const id of ids) {
        if (!appliedIds.includes(id)) appliedIds.push(id);
      }
    }
  }

  report.appliedIds = appliedIds;
  report.skippedIds = changes
    .map((c) => c.id)
    .filter((id) => !appliedIds.includes(id));
  report.summary.applied = appliedIds.length;
  report.summary.failed = applied.failed;

  if (applied.failed > 0) {
    return {
      inspectorId: "modification",
      status: "error",
      error: {
        category: "execution",
        code: "APPLY_FAILED",
        message: `Не удалось применить ${applied.failed} change(s)`,
        retryable: true,
        details: { appliedIds, skippedIds: report.skippedIds },
      },
      data: report,
    };
  }

  return { inspectorId: "modification", status: "ok", data: report };
}

export { hasMutateOp, resolveModificationMode } from "./safety.js";
export { runUndo } from "./undo.js";
