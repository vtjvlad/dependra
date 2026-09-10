import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, extname, relative } from "node:path";
import { parseShebang, probeVersion } from "./which-tool.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

/**
 * @param {string} absPath
 * @param {"name"|"relative"|"absolute"} pathMode
 * @param {string} cwd
 * @returns {string}
 */
function formatPath(absPath, pathMode, cwd) {
  if (pathMode === "name") return basename(absPath);
  if (pathMode === "absolute") return absPath;
  const rel = relative(cwd, absPath);
  return rel.startsWith("..") ? absPath : rel;
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  const targetPath = ctx.targetPath;
  const pathMode = ctx.options.pathMode ?? "relative";

  if (!existsSync(targetPath)) {
    return {
      inspectorId: "runtime-dependency-analysis",
      status: "error",
      error: {
        category: "validation",
        code: "FILE_NOT_FOUND",
        message: `Файл не найден: ${targetPath}`,
        retryable: false,
      },
    };
  }
  try {
    if (!statSync(targetPath).isFile()) {
      return {
        inspectorId: "runtime-dependency-analysis",
        status: "error",
        error: {
          category: "validation",
          code: "NOT_A_FILE",
          message: `Не файл: ${targetPath}`,
          retryable: false,
        },
      };
    }
  } catch {
    return {
      inspectorId: "runtime-dependency-analysis",
      status: "error",
      error: {
        category: "validation",
        code: "NOT_A_FILE",
        message: `Не файл: ${targetPath}`,
        retryable: false,
      },
    };
  }

  let text = "";
  try {
    text = readFileSync(targetPath, "utf8");
  } catch (err) {
    return {
      inspectorId: "runtime-dependency-analysis",
      status: "error",
      error: {
        category: "execution",
        code: "READ_FAILED",
        message: `Не прочитать файл: ${targetPath}`,
        retryable: false,
        details: {
          cause: err instanceof Error ? err.message : String(err),
        },
      },
    };
  }

  const { shebang, interpreter } = parseShebang(text);
  const ext = extname(targetPath).toLowerCase();
  const isJs = [".js", ".mjs", ".cjs"].includes(ext);

  /** @type {object} */
  const details = {};
  let language = "unknown";
  /** @type {object|null} */
  let runtime = null;
  /** @type {object|null} */
  const build = null;

  if (isJs || interpreter === "node" || interpreter === "nodejs") {
    language = "javascript";
    const name =
      interpreter === "nodejs" || interpreter === "node" ? "node" : "node";
    if (interpreter && interpreter !== "node" && interpreter !== "nodejs") {
      details.shebangMismatch = true;
    }
    const probe = probeVersion(name);
    const display = formatPath(targetPath, pathMode, ctx.cwd);
    runtime = {
      kind: "interpreter",
      name,
      available: probe.available,
      version: probe.version,
      commandHint: `${name} ${display}`,
      shebang,
    };
  } else if (interpreter) {
    const map = {
      python: "python3",
      python3: "python3",
      ruby: "ruby",
      php: "php",
      lua: "lua",
      bash: "bash",
      sh: "sh",
    };
    const name = map[interpreter] ?? interpreter;
    language = name;
    const probe = probeVersion(name);
    const display = formatPath(targetPath, pathMode, ctx.cwd);
    runtime = {
      kind: "interpreter",
      name,
      available: probe.available,
      version: probe.version,
      commandHint: `${name} ${display}`,
      shebang,
    };
  } else {
    details.unsupportedLanguage = true;
  }

  return {
    inspectorId: "runtime-dependency-analysis",
    status: "ok",
    data: {
      language,
      runtime,
      build,
      details,
    },
  };
}

/** @type {Inspector} */
export const runtimeDependencyAnalysisInspector = {
  meta: {
    id: "runtime-dependency-analysis",
    version: "0.0.1",
    tags: ["U"],
  },
  analyze,
};
