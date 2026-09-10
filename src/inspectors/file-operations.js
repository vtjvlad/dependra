import { ensureTargetSourceFile, ParserError } from "../parsers/index.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

/** @type {Record<string, "read"|"write"|"create"|"delete"|"change">} */
const FS_API_KIND = {
  readFile: "read",
  readFileSync: "read",
  createReadStream: "read",
  readdir: "read",
  readdirSync: "read",
  read: "read",
  readSync: "read",
  writeFile: "write",
  writeFileSync: "write",
  appendFile: "write",
  appendFileSync: "write",
  createWriteStream: "write",
  write: "write",
  writeSync: "write",
  mkdir: "create",
  mkdirSync: "create",
  unlink: "delete",
  unlinkSync: "delete",
  rm: "delete",
  rmSync: "delete",
  rmdir: "delete",
  rmdirSync: "delete",
  rename: "change",
  renameSync: "change",
  chmod: "change",
  chmodSync: "change",
  chown: "change",
  chownSync: "change",
  truncate: "change",
  truncateSync: "change",
  copyFile: "change",
  copyFileSync: "change",
};

const FS_MODULES = new Set([
  "fs",
  "node:fs",
  "fs/promises",
  "node:fs/promises",
]);

/**
 * @param {object|null|undefined} node
 * @returns {{ line: number, column: number }|undefined}
 */
function locOf(node) {
  if (!node?.loc?.start) return undefined;
  return { line: node.loc.start.line, column: node.loc.start.column };
}

/**
 * @param {string} source
 * @returns {"fs"|"fs/promises"|"unknown"}
 */
function moduleLabel(source) {
  if (source === "fs/promises" || source === "node:fs/promises") {
    return "fs/promises";
  }
  if (source === "fs" || source === "node:fs") return "fs";
  return "unknown";
}

/**
 * @param {object} ast
 * @returns {{
 *   operations: object[],
 *   summary: { read: number, write: number, create: number, delete: number, change: number },
 * }}
 */
function extractFsOperations(ast) {
  /** @type {Set<string>} */
  const fsIds = new Set();
  /** @type {Map<string, string>} localName -> api */
  const namedApis = new Map();
  /** @type {Map<string, "fs"|"fs/promises"|"unknown">} */
  const idModule = new Map();

  /**
   * @param {object|null|undefined} node
   */
  function collectBindings(node) {
    if (!node || typeof node !== "object") return;

    if (node.type === "ImportDeclaration") {
      const source =
        node.source?.type === "Literal" && typeof node.source.value === "string"
          ? node.source.value
          : null;
      if (source && FS_MODULES.has(source)) {
        const mod = moduleLabel(source);
        for (const spec of node.specifiers ?? []) {
          if (spec.type === "ImportNamespaceSpecifier" || spec.type === "ImportDefaultSpecifier") {
            if (spec.local?.name) {
              fsIds.add(spec.local.name);
              idModule.set(spec.local.name, mod);
            }
          } else if (spec.type === "ImportSpecifier") {
            const imported =
              spec.imported?.type === "Identifier" ? spec.imported.name : null;
            const local = spec.local?.name;
            if (imported && local && FS_API_KIND[imported]) {
              namedApis.set(local, imported);
              idModule.set(local, mod);
            }
          }
        }
      }
    }

    if (node.type === "VariableDeclarator") {
      const init = node.init;
      if (
        init?.type === "CallExpression" &&
        init.callee?.type === "Identifier" &&
        init.callee.name === "require" &&
        init.arguments?.[0]?.type === "Literal" &&
        typeof init.arguments[0].value === "string" &&
        FS_MODULES.has(init.arguments[0].value)
      ) {
        const mod = moduleLabel(init.arguments[0].value);
        if (node.id?.type === "Identifier") {
          fsIds.add(node.id.name);
          idModule.set(node.id.name, mod);
        } else if (node.id?.type === "ObjectPattern") {
          for (const prop of node.id.properties ?? []) {
            if (
              prop.type === "Property" &&
              prop.key?.type === "Identifier" &&
              prop.value?.type === "Identifier" &&
              FS_API_KIND[prop.key.name]
            ) {
              namedApis.set(prop.value.name, prop.key.name);
              idModule.set(prop.value.name, mod);
            }
          }
        }
      }
      if (
        init?.type === "MemberExpression" &&
        init.object?.type === "Identifier" &&
        init.object.name === "fs" &&
        !init.computed &&
        init.property?.type === "Identifier" &&
        init.property.name === "promises" &&
        node.id?.type === "Identifier"
      ) {
        fsIds.add(node.id.name);
        idModule.set(node.id.name, "fs/promises");
      }
    }

    for (const key of Object.keys(node)) {
      if (key === "loc" || key === "range" || key === "start" || key === "end") {
        continue;
      }
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) collectBindings(c);
      } else if (child && typeof child === "object" && child.type) {
        collectBindings(child);
      }
    }
  }

  collectBindings(ast);

  /** @type {object[]} */
  const operations = [];

  /**
   * @param {string} api
   * @param {"fs"|"fs/promises"|"unknown"} mod
   * @param {object} callNode
   */
  function pushOp(api, mod, callNode) {
    const kind = FS_API_KIND[api];
    if (!kind) return;
    const arg0 = callNode.arguments?.[0];
    const pathLiteral =
      arg0?.type === "Literal" && typeof arg0.value === "string"
        ? arg0.value
        : null;
    operations.push({
      kind,
      api,
      module: mod,
      pathLiteral,
      display: pathLiteral,
      loc: locOf(callNode),
    });
  }

  /**
   * @param {object|null|undefined} node
   */
  function walkCalls(node) {
    if (!node || typeof node !== "object") return;

    if (node.type === "CallExpression") {
      const callee = node.callee;
      if (
        callee?.type === "MemberExpression" &&
        !callee.computed &&
        callee.object?.type === "Identifier" &&
        callee.property?.type === "Identifier" &&
        fsIds.has(callee.object.name)
      ) {
        pushOp(
          callee.property.name,
          idModule.get(callee.object.name) ?? "fs",
          node,
        );
      } else if (
        callee?.type === "Identifier" &&
        namedApis.has(callee.name)
      ) {
        pushOp(
          /** @type {string} */ (namedApis.get(callee.name)),
          idModule.get(callee.name) ?? "fs",
          node,
        );
      }
    }

    for (const key of Object.keys(node)) {
      if (key === "loc" || key === "range" || key === "start" || key === "end") {
        continue;
      }
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) walkCalls(c);
      } else if (child && typeof child === "object" && child.type) {
        walkCalls(child);
      }
    }
  }

  walkCalls(ast);

  const summary = { read: 0, write: 0, create: 0, delete: 0, change: 0 };
  for (const op of operations) {
    if (op.kind in summary) summary[op.kind] += 1;
  }

  return { operations, summary };
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  let sourceFile;
  try {
    sourceFile = await ensureTargetSourceFile(ctx);
  } catch (err) {
    if (err instanceof ParserError) {
      return {
        inspectorId: "file-operations",
        status: "error",
        error: {
          category: err.category,
          code: err.code,
          message: err.message,
          retryable: false,
          details: err.details,
        },
      };
    }
    throw err;
  }

  if (!sourceFile?.ast) {
    return {
      inspectorId: "file-operations",
      status: "error",
      error: {
        category: "execution",
        code: "PARSE_FAILED",
        message: `Нет AST для файла: ${ctx.targetPath}`,
        retryable: false,
      },
    };
  }

  const pathMode = ctx.options.pathMode ?? "relative";
  const { operations, summary } = extractFsOperations(sourceFile.ast);

  return {
    inspectorId: "file-operations",
    status: "ok",
    data: {
      pathMode,
      operations,
      summary,
    },
  };
}

/** @type {Inspector} */
export const fileOperationsInspector = {
  meta: {
    id: "file-operations",
    version: "0.0.1",
    tags: ["U"],
  },
  analyze,
};
