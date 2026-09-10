/**
 * Undo last (or named) backup session.
 */

import { copyFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import { join } from "node:path";
import { loadBackupSession } from "./backup.js";

/**
 * @param {string} projectRoot
 * @param {string|null} [sessionId]
 * @returns {{ ok: true, report: import('./types.js').ModificationReport } | { ok: false, code: string, message: string }}
 */
export function runUndo(projectRoot, sessionId = null) {
  const loaded = loadBackupSession(projectRoot, sessionId);
  if (!loaded) {
    return {
      ok: false,
      code: "NO_BACKUP_SESSION",
      message: "Нет backup session для undo",
    };
  }

  /** @type {import('./types.js').Change[]} */
  const changes = [];
  /** @type {string[]} */
  const appliedIds = [];
  /** @type {string[]} */
  const skippedIds = [];
  let failed = 0;
  let i = 0;

  for (const f of loaded.manifest.files ?? []) {
    i += 1;
    const id = `u${i}`;
    if (f.kind === "exec") {
      skippedIds.push(id);
      changes.push({
        id,
        kind: "exec",
        path: f.path ?? projectRoot,
        op: "undo",
        summary: "exec не откатывается (node_modules)",
        risk: "dangerous",
        selected: false,
        skippedReason: "exec-not-undoable",
        details: f.details ?? null,
      });
      continue;
    }
    if (f.kind === "create") {
      try {
        if (f.path && existsSync(f.path)) unlinkSync(f.path);
        appliedIds.push(id);
        changes.push({
          id,
          kind: "delete",
          path: f.path,
          op: "undo",
          summary: `удалён созданный файл`,
          risk: "caution",
          selected: true,
        });
      } catch (err) {
        failed += 1;
        skippedIds.push(id);
        changes.push({
          id,
          kind: "delete",
          path: f.path,
          op: "undo",
          summary: "не удалось удалить create",
          risk: "caution",
          selected: true,
          details: {
            applyError: err instanceof Error ? err.message : String(err),
          },
        });
      }
      continue;
    }

    const backupFile = join(loaded.dir, "files", f.rel);
    if (!f.rel || !existsSync(backupFile)) {
      failed += 1;
      skippedIds.push(id);
      changes.push({
        id,
        kind: "update",
        path: f.path,
        op: "undo",
        summary: "backup file missing",
        risk: "caution",
        selected: true,
        skippedReason: "backup-missing",
      });
      continue;
    }

    try {
      mkdirSync(dirname(f.path), { recursive: true });
      copyFileSync(backupFile, f.path);
      appliedIds.push(id);
      changes.push({
        id,
        kind: "update",
        path: f.path,
        op: "undo",
        summary: `восстановлен ${f.rel}`,
        risk: "safe",
        selected: true,
      });
    } catch (err) {
      failed += 1;
      skippedIds.push(id);
      changes.push({
        id,
        kind: "update",
        path: f.path,
        op: "undo",
        summary: "undo failed",
        risk: "caution",
        selected: true,
        details: {
          applyError: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  /** @type {Object.<string, number>} */
  const byOp = { undo: changes.length };

  return {
    ok: true,
    report: {
      mode: "undo",
      changes,
      appliedIds,
      skippedIds,
      backup: {
        sessionId: loaded.sessionId,
        dir: loaded.dir,
        createdAt: loaded.manifest.createdAt ?? "",
      },
      summary: {
        proposed: changes.length,
        applied: appliedIds.length,
        failed,
        byOp,
      },
    },
  };
}
