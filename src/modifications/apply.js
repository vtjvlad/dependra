/**
 * Apply selected changes to the filesystem.
 */

import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * @param {import('./types.js').Change} change
 * @param {{ execRunner?: Function }} [hooks]
 * @returns {{ ok: boolean, error?: string }}
 */
export function applyOneChange(change, hooks = {}) {
  try {
    if (change.kind === "update" || change.kind === "create") {
      if (typeof change.after !== "string") {
        return { ok: false, error: "missing after text" };
      }
      mkdirSync(dirname(change.path), { recursive: true });
      writeFileSync(change.path, change.after, "utf8");
      return { ok: true };
    }
    if (change.kind === "delete") {
      unlinkSync(change.path);
      return { ok: true };
    }
    if (change.kind === "exec") {
      const runner = hooks.execRunner ?? defaultExecRunner;
      return runner(change);
    }
    return { ok: false, error: `unsupported kind: ${change.kind}` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * @param {import('./types.js').Change} change
 * @returns {{ ok: boolean, error?: string }}
 */
function defaultExecRunner(change) {
  const pm = change.details?.pm ?? "npm";
  const argv = change.details?.argv ?? ["install"];
  const cwd = change.details?.cwd ?? dirname(change.path);
  const r = spawnSync(pm, argv, {
    cwd,
    encoding: "utf8",
    timeout: change.details?.timeoutMs ?? 120_000,
    env: process.env,
  });
  if (r.error) {
    return { ok: false, error: r.error.message };
  }
  if (r.status !== 0) {
    return {
      ok: false,
      error: (r.stderr || r.stdout || `exit ${r.status}`).slice(0, 500),
    };
  }
  return { ok: true };
}

/**
 * @param {import('./types.js').Change[]} changes
 * @param {{ execRunner?: Function }} [hooks]
 * @returns {{ appliedIds: string[], skippedIds: string[], failed: number }}
 */
export function applyChanges(changes, hooks = {}) {
  /** @type {string[]} */
  const appliedIds = [];
  /** @type {string[]} */
  const skippedIds = [];
  let failed = 0;

  for (const c of changes) {
    if (!c.selected || c.skippedReason) {
      skippedIds.push(c.id);
      continue;
    }
    const r = applyOneChange(c, hooks);
    if (r.ok) {
      appliedIds.push(c.id);
    } else {
      failed += 1;
      skippedIds.push(c.id);
      c.details = { ...(c.details ?? {}), applyError: r.error };
    }
  }

  return { appliedIds, skippedIds, failed };
}
