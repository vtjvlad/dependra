import { readdirSync, statSync, existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { ensureBuiltInBackends, listExtensions } from "../parsers/index.js";

const SKIP_DIRS = new Set(["node_modules", ".git"]);

/**
 * @returns {Set<string>}
 */
function sourceExts() {
  ensureBuiltInBackends();
  const exts = listExtensions();
  return new Set(
    exts.length > 0 ? exts : [".js", ".mjs", ".cjs", ".ts", ".tsx"],
  );
}

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
 * Рекурсивно собирает исходники зарегистрированных языков под root
 * (без node_modules/.git). Имя сохранено для совместимости S01–S08.
 *
 * @param {string} root
 * @returns {string[]}
 */
export function listJavaScriptFiles(root) {
  const EXTS = sourceExts();
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
      if (ent.isFile() && EXTS.has(extname(ent.name).toLowerCase())) {
        out.push(full);
      }
    }
  }

  try {
    const st = statSync(root);
    if (st.isFile()) {
      if (EXTS.has(extname(root).toLowerCase())) out.push(root);
      return out;
    }
  } catch {
    return out;
  }

  walk(root);
  return out;
}
