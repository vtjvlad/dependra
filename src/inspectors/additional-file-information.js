import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, relative } from "node:path";
import { findProjectRoot, listJavaScriptFiles } from "./scan-js-files.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

const COPY_SCORE_THRESHOLD = 0.75;
const PREFIX_LINES = 8;

/**
 * @param {number} mode
 * @returns {string}
 */
function modeToString(mode) {
  const perms = mode & 0o777;
  const chars = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];
  const u = chars[(perms >> 6) & 7];
  const g = chars[(perms >> 3) & 7];
  const o = chars[perms & 7];
  return `${u}${g}${o}`;
}

/**
 * @param {number} mode
 * @returns {string}
 */
function modeToOctal(mode) {
  return (mode & 0o777).toString(8).padStart(4, "0");
}

/**
 * @param {import('node:fs').Stats} st
 * @returns {{ read: string, write: string, chmod: string, delete: string }}
 */
function privilegeHints(st) {
  /** @type {(v: string) => string} */
  const hint = (v) => v;
  try {
    const uid =
      typeof process.getuid === "function" ? process.getuid() : null;
    if (uid == null) {
      return {
        read: hint("unknown"),
        write: hint("unknown"),
        chmod: hint("unknown"),
        delete: hint("unknown"),
      };
    }
    const mode = st.mode & 0o777;
    const isOwner = st.uid === uid;
    const ownerRead = (mode & 0o400) !== 0;
    const ownerWrite = (mode & 0o200) !== 0;
    const otherRead = (mode & 0o004) !== 0;
    const otherWrite = (mode & 0o002) !== 0;
    const canRead = isOwner ? ownerRead : otherRead || (mode & 0o040) !== 0;
    const canWrite = isOwner ? ownerWrite : otherWrite || (mode & 0o020) !== 0;
    return {
      read: canRead ? "ok" : "may-need-elevated",
      write: canWrite ? "ok" : "may-need-elevated",
      chmod: isOwner ? "ok" : "may-need-elevated",
      delete: canWrite ? "ok" : "may-need-elevated",
    };
  } catch {
    return {
      read: "unknown",
      write: "unknown",
      chmod: "unknown",
      delete: "unknown",
    };
  }
}

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
 * @param {string} text
 * @returns {string}
 */
function prefixFingerprint(text) {
  return text.split(/\r?\n/).slice(0, PREFIX_LINES).join("\n");
}

/**
 * @param {string} targetPath
 * @param {import('node:fs').Stats} targetStat
 * @param {string} targetText
 * @param {string} candidatePath
 * @returns {Promise<{ score: number, matchedBy: string[] }|null>}
 */
async function scoreCopy(targetPath, targetStat, targetText, candidatePath) {
  if (candidatePath === targetPath) return null;
  let st;
  try {
    st = await stat(candidatePath);
  } catch {
    return null;
  }
  if (!st.isFile()) return null;

  /** @type {string[]} */
  const matchedBy = [];
  let score = 0;

  if (st.size === targetStat.size) {
    matchedBy.push("size");
    score += 0.35;
  } else if (Math.abs(st.size - targetStat.size) / Math.max(targetStat.size, 1) < 0.05) {
    matchedBy.push("size");
    score += 0.15;
  } else {
    return null;
  }

  let candidateText;
  try {
    candidateText = await readFile(candidatePath, "utf8");
  } catch {
    return null;
  }

  const targetHash = createHash("sha256").update(targetText).digest("hex");
  const candHash = createHash("sha256").update(candidateText).digest("hex");
  if (targetHash === candHash) {
    matchedBy.push("checksum");
    score += 0.5;
  }

  if (prefixFingerprint(targetText) === prefixFingerprint(candidateText)) {
    matchedBy.push("prefix");
    score += 0.2;
  }

  if (score < COPY_SCORE_THRESHOLD) return null;
  return { score: Math.min(1, Number(score.toFixed(2))), matchedBy };
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  const targetPath = ctx.targetPath;
  const cwd = ctx.cwd;
  const pathMode = ctx.options.pathMode ?? "relative";

  let st;
  try {
    st = await stat(targetPath);
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err ? err.code : undefined;
    if (code === "ENOENT") {
      return {
        inspectorId: "additional-file-information",
        status: "error",
        error: {
          category: "validation",
          code: "FILE_NOT_FOUND",
          message: `Файл не найден: ${targetPath}`,
          retryable: false,
          details: { filePath: targetPath },
        },
      };
    }
    return {
      inspectorId: "additional-file-information",
      status: "error",
      error: {
        category: "execution",
        code: "STAT_FAILED",
        message: `Не удалось прочитать stat: ${targetPath}`,
        retryable: false,
        details: {
          filePath: targetPath,
          cause: err instanceof Error ? err.message : String(err),
        },
      },
    };
  }

  if (!st.isFile()) {
    return {
      inspectorId: "additional-file-information",
      status: "error",
      error: {
        category: "validation",
        code: "NOT_A_FILE",
        message: `Не файл: ${targetPath}`,
        retryable: false,
        details: { filePath: targetPath },
      },
    };
  }

  const rel = relative(cwd, targetPath);
  const relativePath = rel.startsWith("..") ? targetPath : rel;

  /** @type {object[]} */
  const copies = [];
  /** @type {string|undefined} */
  let scanWarning;

  let targetText = "";
  try {
    targetText = await readFile(targetPath, "utf8");
  } catch (err) {
    scanWarning = `Не удалось прочитать целевой файл для поиска копий: ${
      err instanceof Error ? err.message : String(err)
    }`;
  }

  if (!scanWarning) {
    try {
      const root = findProjectRoot(dirname(targetPath), cwd);
      const targetExt = extname(targetPath).toLowerCase();
      const candidates = listJavaScriptFiles(root).filter(
        (p) => extname(p).toLowerCase() === targetExt,
      );
      for (const candidate of candidates) {
        const scored = await scoreCopy(
          targetPath,
          st,
          targetText,
          candidate,
        );
        if (!scored) continue;
        copies.push({
          display: formatDisplay(candidate, candidate, pathMode, cwd),
          path: candidate,
          score: scored.score,
          matchedBy: scored.matchedBy,
        });
      }
      copies.sort((a, b) => b.score - a.score || a.display.localeCompare(b.display));
    } catch (err) {
      scanWarning = `Сбой поиска копий: ${
        err instanceof Error ? err.message : String(err)
      }`;
    }
  }

  /** @type {object} */
  const data = {
    absolutePath: targetPath,
    relativePath,
    permissions: {
      modeOctal: modeToOctal(st.mode),
      modeString: modeToString(st.mode),
      uid: String(st.uid),
      gid: String(st.gid),
    },
    privilegeHints: privilegeHints(st),
    copies,
  };

  if (scanWarning) {
    data.details = { scanWarning };
  }

  return {
    inspectorId: "additional-file-information",
    status: "ok",
    data,
  };
}

/** @type {Inspector} */
export const additionalFileInformationInspector = {
  meta: {
    id: "additional-file-information",
    version: "0.0.1",
    tags: ["B"],
  },
  analyze,
};
