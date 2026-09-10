import { readdirSync, statSync, existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const JS_EXTS = new Set([".js", ".mjs", ".cjs"]);
const SKIP_DIRS = new Set(["node_modules", ".git"]);

/**
 * Ближайший каталог с package.json вверх от startDir, иначе fallbackCwd.
 *
 * @param {string} startDir
 * @param {string} fallbackCwd
 * @returns {string}
 */
export function findProjectRoot(startDir, fallbackCwd) {
  let dir = startDir;
  for (;;) {
    if (existsSync(join(dir, "package.json"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return fallbackCwd;
}

/**
 * Рекурсивно собирает .js/.mjs/.cjs под root (без node_modules/.git).
 *
 * @param {string} root
 * @returns {string[]}
 */
export function listJavaScriptFiles(root) {
  /** @type {string[]} */
  const out = [];

  /**
   * @param {string} dir
   */
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name)) continue;
        walk(full);
        continue;
      }
      if (ent.isFile() && JS_EXTS.has(extname(ent.name).toLowerCase())) {
        out.push(full);
      }
    }
  }

  try {
    const st = statSync(root);
    if (st.isFile()) {
      if (JS_EXTS.has(extname(root).toLowerCase())) out.push(root);
      return out;
    }
  } catch {
    return out;
  }

  walk(root);
  return out;
}
