import { existsSync, statSync } from "node:fs";
import { resolveOnPath } from "./which-tool.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

/** Каталог утилит работы с файлом (не рантаймы запуска). */
const FILE_UTILS = [
  "cat",
  "less",
  "more",
  "head",
  "tail",
  "grep",
  "sed",
  "awk",
  "diff",
  "cp",
  "mv",
  "ln",
  "stat",
  "file",
  "strings",
  "hexdump",
  "od",
  "wc",
  "base64",
  "sha256sum",
  "shasum",
  "md5sum",
];

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  const targetPath = ctx.targetPath;
  if (!existsSync(targetPath)) {
    return {
      inspectorId: "commands",
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
        inspectorId: "commands",
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
      inspectorId: "commands",
      status: "error",
      error: {
        category: "validation",
        code: "NOT_A_FILE",
        message: `Не файл: ${targetPath}`,
        retryable: false,
      },
    };
  }

  const pathEnv = process.env.PATH ?? "";
  /** @type {{ name: string, available: boolean }[]} */
  const commands = FILE_UTILS.map((name) => ({
    name,
    available: resolveOnPath(name, pathEnv) != null,
  }));

  /** @type {object} */
  const data = { commands };
  if (!pathEnv) data.details = { pathMissing: true };

  return {
    inspectorId: "commands",
    status: "ok",
    data,
  };
}

/** @type {Inspector} */
export const commandsInspector = {
  meta: {
    id: "commands",
    version: "0.0.1",
    tags: ["P"],
  },
  analyze,
};
