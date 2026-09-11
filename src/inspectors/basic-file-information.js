import { stat } from "node:fs/promises";
import { basename, extname } from "node:path";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

/**
 * @param {string} ext lowercase with dot or ""
 * @returns {{ format: string, mimeType: string|null, language: "javascript"|"typescript"|"unknown", engine: "node"|null }}
 */
function classifyByExt(ext) {
  switch (ext) {
    case ".js":
    case ".mjs":
    case ".cjs":
      return {
        format: "javascript",
        mimeType: "text/javascript",
        language: "javascript",
        engine: "node",
      };
    case ".jsx":
      return {
        format: "jsx",
        mimeType: "text/javascript",
        language: "javascript",
        engine: "node",
      };
    case ".ts":
      return {
        format: "typescript",
        mimeType: "text/typescript",
        language: "typescript",
        engine: "node",
      };
    case ".tsx":
      return {
        format: "tsx",
        mimeType: "text/typescript",
        language: "typescript",
        engine: "node",
      };
    case ".json":
      return {
        format: "json",
        mimeType: "application/json",
        language: "unknown",
        engine: null,
      };
    case ".md":
      return {
        format: "markdown",
        mimeType: "text/markdown",
        language: "unknown",
        engine: null,
      };
    default:
      return {
        format: "unknown",
        mimeType: null,
        language: "unknown",
        engine: null,
      };
  }
}

/**
 * @param {Date} date
 * @param {number} ms
 * @returns {string|null}
 */
function toIsoOrNull(date, ms) {
  if (!Number.isFinite(ms) || ms <= 0) return null;
  try {
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * @param {unknown} n
 * @returns {string|null}
 */
function idToString(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return String(n);
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  const targetPath = ctx.targetPath;

  let st;
  try {
    st = await stat(targetPath);
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err ? err.code : undefined;
    if (code === "ENOENT") {
      return {
        inspectorId: "basic-file-information",
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
      inspectorId: "basic-file-information",
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
      inspectorId: "basic-file-information",
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

  const name = basename(targetPath);
  const ext = extname(name);
  const classified = classifyByExt(ext.toLowerCase());

  const data = {
    name,
    ext,
    format: classified.format,
    mimeType: classified.mimeType,
    size: st.size,
    createdAt: toIsoOrNull(st.birthtime, st.birthtimeMs),
    modifiedAt: st.mtime.toISOString(),
    accessedAt: toIsoOrNull(st.atime, st.atimeMs),
    owner: idToString(st.uid),
    group: idToString(st.gid),
    language: classified.language,
    engine: classified.engine,
    fileType: /** @type {"file"} */ ("file"),
  };

  const prev = ctx.projectModel.files[targetPath];
  ctx.projectModel.files[targetPath] = {
    ...(prev ?? {}),
    path: targetPath,
    basic: data,
  };

  return {
    inspectorId: "basic-file-information",
    status: "ok",
    data,
  };
}

/** @type {Inspector} */
export const basicFileInformationInspector = {
  meta: {
    id: "basic-file-information",
    version: "0.0.1",
    tags: ["B"],
  },
  analyze,
};
