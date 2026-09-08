import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { findProjectRoot } from "./scan-js-files.js";
import { parseShebang, probeVersion } from "./which-tool.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

/**
 * @param {string} root
 * @returns {string[]}
 */
function lockfileManagers(root) {
  /** @type {string[]} */
  const managers = [];
  if (existsSync(join(root, "package-lock.json"))) managers.push("npm");
  if (existsSync(join(root, "pnpm-lock.yaml"))) managers.push("pnpm");
  if (existsSync(join(root, "yarn.lock"))) managers.push("yarn");
  if (
    existsSync(join(root, "bun.lockb")) ||
    existsSync(join(root, "bun.lock"))
  ) {
    managers.push("bun");
  }
  return managers;
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  const targetPath = ctx.targetPath;
  if (!existsSync(targetPath)) {
    return {
      inspectorId: "environment-validation",
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
        inspectorId: "environment-validation",
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
      inspectorId: "environment-validation",
      status: "error",
      error: {
        category: "validation",
        code: "NOT_A_FILE",
        message: `Не файл: ${targetPath}`,
        retryable: false,
      },
    };
  }

  const root = findProjectRoot(dirname(targetPath), ctx.cwd);
  const ext = extname(targetPath).toLowerCase();
  const isJs = [".js", ".mjs", ".cjs"].includes(ext);

  let shebangText = "";
  try {
    shebangText = readFileSync(targetPath, "utf8").slice(0, 200);
  } catch {
    /* ignore */
  }
  const { interpreter } = parseShebang(shebangText);

  /** @type {Map<string, boolean>} name -> required */
  const want = new Map();

  if (isJs || existsSync(join(root, "package.json"))) {
    want.set("node", true);
    const managers = lockfileManagers(root);
    if (managers.length === 0) {
      want.set("npm", false);
    } else {
      for (const m of managers) want.set(m, true);
    }
  }

  if (interpreter) {
    const map = {
      node: "node",
      nodejs: "node",
      python: "python3",
      python3: "python3",
      ruby: "ruby",
      bash: "bash",
      sh: "sh",
      php: "php",
      lua: "lua",
    };
    const tool = map[interpreter] ?? interpreter;
    if (!want.has(tool)) want.set(tool, true);
  }

  /** @type {{ name: string, required: boolean, available: boolean, version: string|null }[]} */
  const tools = [];
  for (const [name, required] of want) {
    const probe = probeVersion(name);
    tools.push({
      name,
      required,
      available: probe.available,
      version: probe.version,
    });
  }

  const missing = tools
    .filter((t) => t.required && !t.available)
    .map((t) => t.name);

  return {
    inspectorId: "environment-validation",
    status: "ok",
    data: {
      tools,
      missing,
    },
  };
}

/** @type {Inspector} */
export const environmentValidationInspector = {
  meta: {
    id: "environment-validation",
    version: "0.0.1",
    tags: ["P"],
  },
  analyze,
};
