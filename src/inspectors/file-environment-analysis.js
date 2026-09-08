import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  statSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { findProjectRoot } from "./scan-js-files.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

const SCAN_CAP = 5000;
const SKIP_DIRS = new Set(["node_modules", ".git"]);

/**
 * @param {string|null} absPath
 * @param {string} fallback
 * @param {"name"|"relative"|"absolute"} pathMode
 * @param {string} cwd
 * @returns {string}
 */
function formatDisplay(absPath, fallback, pathMode, cwd) {
  if (!absPath) return fallback;
  if (pathMode === "name") return basename(absPath);
  if (pathMode === "absolute") return absPath;
  const rel = relative(cwd, absPath);
  return rel.startsWith("..") ? absPath : rel;
}

/**
 * @param {string} root
 * @param {number} cap
 * @returns {{ files: string[], truncated: boolean }}
 */
function listProjectFiles(root, cap) {
  /** @type {string[]} */
  const files = [];
  let truncated = false;

  /**
   * @param {string} dir
   */
  function walk(dir) {
    if (files.length >= cap) {
      truncated = true;
      return;
    }
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (files.length >= cap) {
        truncated = true;
        return;
      }
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name)) continue;
        walk(full);
      } else if (ent.isFile() || ent.isSymbolicLink()) {
        files.push(full);
      }
    }
  }

  walk(root);
  return { files, truncated };
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  const targetPath = ctx.targetPath;
  const cwd = ctx.cwd;
  const pathMode = ctx.options.pathMode ?? "relative";

  if (!existsSync(targetPath)) {
    return {
      inspectorId: "file-environment-analysis",
      status: "error",
      error: {
        category: "validation",
        code: "FILE_NOT_FOUND",
        message: `Файл не найден: ${targetPath}`,
        retryable: false,
      },
    };
  }

  let lst;
  try {
    lst = lstatSync(targetPath);
  } catch (err) {
    return {
      inspectorId: "file-environment-analysis",
      status: "error",
      error: {
        category: "execution",
        code: "READ_FAILED",
        message: `Не прочитать metadata: ${targetPath}`,
        retryable: false,
        details: {
          cause: err instanceof Error ? err.message : String(err),
        },
      },
    };
  }

  if (!lst.isFile() && !lst.isSymbolicLink()) {
    return {
      inspectorId: "file-environment-analysis",
      status: "error",
      error: {
        category: "validation",
        code: "NOT_A_FILE",
        message: `Не файл: ${targetPath}`,
        retryable: false,
      },
    };
  }

  const isSymlink = lst.isSymbolicLink();
  let linkTarget = null;
  let realpath = targetPath;
  try {
    if (isSymlink) {
      linkTarget = readlinkSync(targetPath);
    }
    realpath = realpathSync(targetPath);
  } catch {
    /* best-effort */
  }

  /** @type {object} */
  const details = { crontabSkipped: true };

  const hardLink = {
    nlink: typeof lst.nlink === "number" ? lst.nlink : 1,
    inode: lst.ino != null ? String(lst.ino) : null,
    peers: /** @type {{ display: string, path: string }[]} */ ([]),
  };

  let root;
  try {
    root = findProjectRoot(dirname(targetPath), cwd);
  } catch (err) {
    return {
      inspectorId: "file-environment-analysis",
      status: "error",
      error: {
        category: "execution",
        code: "SCAN_FAILED",
        message: "Не удалось определить корень проекта",
        retryable: false,
        details: {
          cause: err instanceof Error ? err.message : String(err),
        },
      },
    };
  }

  let scan;
  try {
    scan = listProjectFiles(root, SCAN_CAP);
  } catch (err) {
    return {
      inspectorId: "file-environment-analysis",
      status: "error",
      error: {
        category: "execution",
        code: "SCAN_FAILED",
        message: `Сбой обхода корня: ${root}`,
        retryable: false,
        details: {
          root,
          cause: err instanceof Error ? err.message : String(err),
        },
      },
    };
  }
  if (scan.truncated) details.scanTruncated = true;

  if (hardLink.nlink > 1 && hardLink.inode != null && lst.dev != null) {
    for (const f of scan.files) {
      if (f === targetPath) continue;
      try {
        const st = statSync(f);
        if (st.ino === lst.ino && st.dev === lst.dev) {
          hardLink.peers.push({
            display: formatDisplay(f, f, pathMode, cwd),
            path: f,
          });
        }
      } catch {
        /* skip */
      }
    }
  } else if (lst.ino == null) {
    details.hardLinksUnsupported = true;
  }

  const targetBase = basename(targetPath);
  /** @type {object[]} */
  const scripts = [];
  for (const f of scan.files) {
    if (f === targetPath) continue;
    const base = basename(f);
    const isSh = base.endsWith(".sh");
    let text = "";
    try {
      const st = lstatSync(f);
      if (!st.isFile() && !st.isSymbolicLink()) continue;
      if (st.size > 256_000) continue;
      text = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    const hasShebang = text.startsWith("#!");
    if (!isSh && !hasShebang) continue;
    const mentionsBase = text.includes(targetBase);
    const mentionsPath =
      text.includes(targetPath) ||
      text.includes(relative(root, targetPath)) ||
      text.includes(`./${relative(root, targetPath)}`);
    if (!mentionsBase && !mentionsPath) continue;
    scripts.push({
      display: formatDisplay(f, f, pathMode, cwd),
      path: f,
      kind: text.startsWith("#!/bin/bash") || text.startsWith("#!/usr/bin/bash")
        ? "bash"
        : hasShebang || isSh
          ? "shell"
          : "other",
      mention: mentionsPath ? "path" : "basename",
    });
  }

  /** @type {object[]} */
  const entryPoints = [];
  const pkgPath = join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const realTarget = realpath;
      /**
       * @param {string} value
       * @param {string} kind
       * @param {string} label
       */
      function checkPkgPath(value, kind, label) {
        if (typeof value !== "string") return;
        const abs = join(root, value);
        try {
          if (realpathSync(abs) === realTarget || abs === targetPath) {
            entryPoints.push({
              kind,
              display: label,
              path: pkgPath,
            });
          }
        } catch {
          if (abs === targetPath || value.endsWith(targetBase)) {
            entryPoints.push({ kind, display: label, path: pkgPath });
          }
        }
      }
      if (pkg.main) checkPkgPath(pkg.main, "package-main", "package.json#main");
      if (typeof pkg.bin === "string") {
        checkPkgPath(pkg.bin, "package-bin", "package.json#bin");
      } else if (pkg.bin && typeof pkg.bin === "object") {
        for (const [name, val] of Object.entries(pkg.bin)) {
          checkPkgPath(val, "package-bin", `package.json#bin.${name}`);
        }
      }
      if (pkg.scripts && typeof pkg.scripts === "object") {
        for (const [name, val] of Object.entries(pkg.scripts)) {
          if (typeof val === "string" && val.includes(targetBase)) {
            entryPoints.push({
              kind: "package-script",
              display: `package.json#scripts.${name}`,
              path: pkgPath,
            });
          }
        }
      }
    } catch {
      /* ignore bad package.json */
    }
  }

  try {
    const head = readFileSync(targetPath, "utf8").slice(0, 200);
    if (head.startsWith("#!") && /node/.test(head.split(/\r?\n/, 1)[0] ?? "")) {
      entryPoints.push({
        kind: "shebang",
        display: formatDisplay(targetPath, targetPath, pathMode, cwd),
        path: targetPath,
      });
    }
  } catch {
    /* ignore */
  }

  return {
    inspectorId: "file-environment-analysis",
    status: "ok",
    data: {
      pathMode,
      symlink: {
        isSymlink,
        target: linkTarget,
        realpath,
      },
      hardLink,
      scripts,
      entryPoints,
      details,
    },
  };
}

/** @type {Inspector} */
export const fileEnvironmentAnalysisInspector = {
  meta: {
    id: "file-environment-analysis",
    version: "0.0.1",
    tags: ["P"],
  },
  analyze,
};
