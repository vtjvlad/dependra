import { ensureTargetSourceFile, ParserError } from "../parsers/index.js";
import { resolveSpecifier } from "./resolve-specifier.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

/**
 * @param {object|null|undefined} node
 * @returns {{ line: number, column: number }|undefined}
 */
function locOf(node) {
  if (!node?.loc?.start) return undefined;
  return { line: node.loc.start.line, column: node.loc.start.column };
}

/**
 * @param {object} node
 * @returns {boolean}
 */
function isRequireCallee(node) {
  return node?.type === "Identifier" && node.name === "require";
}

/**
 * @param {object} node
 * @returns {boolean}
 */
function isModuleExports(node) {
  return (
    node?.type === "MemberExpression" &&
    !node.computed &&
    node.object?.type === "Identifier" &&
    node.object.name === "module" &&
    node.property?.type === "Identifier" &&
    node.property.name === "exports"
  );
}

/**
 * @param {object} node
 * @returns {boolean}
 */
function isExportsMember(node) {
  return (
    node?.type === "MemberExpression" &&
    node.object?.type === "Identifier" &&
    node.object.name === "exports"
  );
}

/**
 * @param {object} ast
 * @param {string} filePath
 * @returns {{
 *   moduleKind: "esm"|"cjs"|"unknown",
 *   imports: object[],
 *   exports: object[],
 * }}
 */
export function extractImportExport(ast, filePath) {
  /** @type {object[]} */
  const imports = [];
  /** @type {object[]} */
  const exports = [];

  let sawEsmSyntax = false;
  let sawCjs = false;

  /**
   * @param {string|null} source
   * @param {"static"|"dynamic"|"require"} kind
   * @param {object} node
   * @param {"value"|"type"|"typeof"} [importKind="value"]
   */
  function pushImport(source, kind, node, importKind = "value") {
    const { isExternal, resolvedPath } = resolveSpecifier(source, filePath);
    /** @type {Record<string, unknown>} */
    const record = {
      source,
      kind,
      resolvedPath,
      isExternal,
      loc: locOf(node),
    };
    if (importKind !== "value") {
      record.importKind = importKind;
    }
    imports.push(record);
  }

  /**
   * @param {object} node
   * @returns {"value"|"type"|"typeof"}
   */
  function importKindOf(node) {
    const k = node?.importKind ?? node?.exportKind;
    if (k === "type" || k === "typeof") return k;
    return "value";
  }

  /**
   * @param {object} record
   */
  function pushExport(record) {
    exports.push(record);
  }

  /**
   * @param {object|null|undefined} node
   */
  function walk(node) {
    if (!node || typeof node !== "object") return;

    switch (node.type) {
      case "ImportDeclaration": {
        sawEsmSyntax = true;
        const source =
          node.source?.type === "Literal" && typeof node.source.value === "string"
            ? node.source.value
            : null;
        if (source != null) pushImport(source, "static", node, importKindOf(node));
        break;
      }
      case "ExportNamedDeclaration": {
        sawEsmSyntax = true;
        const from =
          node.source?.type === "Literal" && typeof node.source.value === "string"
            ? node.source.value
            : null;
        const exportKind = importKindOf(node);
        if (from != null) {
          pushImport(from, "static", node, exportKind);
          if (Array.isArray(node.specifiers) && node.specifiers.length > 0) {
            for (const spec of node.specifiers) {
              const name =
                spec.exported?.type === "Identifier"
                  ? spec.exported.name
                  : null;
              pushExport({
                kind: "named",
                name,
                from,
                loc: locOf(spec),
                ...(exportKind !== "value" ? { exportKind } : {}),
              });
            }
          } else {
            pushExport({
              kind: "named",
              name: null,
              from,
              loc: locOf(node),
              ...(exportKind !== "value" ? { exportKind } : {}),
            });
          }
        } else if (Array.isArray(node.specifiers)) {
          for (const spec of node.specifiers) {
            const name =
              spec.exported?.type === "Identifier" ? spec.exported.name : null;
            pushExport({
              kind: "named",
              name,
              from: null,
              loc: locOf(spec),
              ...(exportKind !== "value" ? { exportKind } : {}),
            });
          }
        }
        if (node.declaration) {
          const decl = node.declaration;
          if (
            decl.type === "FunctionDeclaration" ||
            decl.type === "ClassDeclaration" ||
            decl.type === "TSTypeAliasDeclaration" ||
            decl.type === "TSInterfaceDeclaration" ||
            decl.type === "TSEnumDeclaration"
          ) {
            pushExport({
              kind: "named",
              name: decl.id?.name ?? null,
              from: null,
              loc: locOf(decl),
              ...(exportKind !== "value" ? { exportKind } : {}),
            });
          } else if (decl.type === "VariableDeclaration") {
            for (const d of decl.declarations) {
              if (d.id?.type === "Identifier") {
                pushExport({
                  kind: "named",
                  name: d.id.name,
                  from: null,
                  loc: locOf(d),
                });
              }
            }
          }
        }
        break;
      }
      case "ExportDefaultDeclaration": {
        sawEsmSyntax = true;
        pushExport({
          kind: "default",
          name: "default",
          from: null,
          loc: locOf(node),
        });
        break;
      }
      case "ExportAllDeclaration": {
        sawEsmSyntax = true;
        const from =
          node.source?.type === "Literal" && typeof node.source.value === "string"
            ? node.source.value
            : null;
        const exportKind = importKindOf(node);
        if (from != null) pushImport(from, "static", node, exportKind);
        pushExport({
          kind: "all",
          name: node.exported?.name ?? null,
          from,
          loc: locOf(node),
          ...(exportKind !== "value" ? { exportKind } : {}),
        });
        break;
      }
      case "ImportExpression": {
        // acorn may use ImportExpression for import()
        const arg = node.source;
        if (arg?.type === "Literal" && typeof arg.value === "string") {
          pushImport(arg.value, "dynamic", node);
        } else {
          pushImport(null, "dynamic", node);
        }
        break;
      }
      case "CallExpression": {
        if (node.callee?.type === "Import") {
          const arg = node.arguments?.[0];
          if (arg?.type === "Literal" && typeof arg.value === "string") {
            pushImport(arg.value, "dynamic", node);
          } else {
            pushImport(null, "dynamic", node);
          }
        } else if (isRequireCallee(node.callee)) {
          const arg = node.arguments?.[0];
          if (arg?.type === "Literal" && typeof arg.value === "string") {
            sawCjs = true;
            pushImport(arg.value, "require", node);
          }
        }
        break;
      }
      case "AssignmentExpression": {
        const left = node.left;
        if (isModuleExports(left)) {
          sawCjs = true;
          pushExport({
            kind: "commonjs",
            name: null,
            from: null,
            loc: locOf(node),
          });
        } else if (isExportsMember(left)) {
          sawCjs = true;
          const name =
            !left.computed && left.property?.type === "Identifier"
              ? left.property.name
              : left.computed &&
                  left.property?.type === "Literal" &&
                  typeof left.property.value === "string"
                ? left.property.value
                : null;
          pushExport({
            kind: "commonjs",
            name,
            from: null,
            loc: locOf(node),
          });
        }
        break;
      }
      default:
        break;
    }

    for (const key of Object.keys(node)) {
      if (key === "loc" || key === "range" || key === "start" || key === "end") {
        continue;
      }
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) walk(c);
      } else if (child && typeof child === "object" && child.type) {
        walk(child);
      }
    }
  }

  walk(ast);

  /** @type {"esm"|"cjs"|"unknown"} */
  let moduleKind = "unknown";
  if (sawEsmSyntax) moduleKind = "esm";
  else if (sawCjs) moduleKind = "cjs";

  return { moduleKind, imports, exports };
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
        inspectorId: "import-export-analysis",
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

  if (!sourceFile.ast) {
    return {
      inspectorId: "import-export-analysis",
      status: "error",
      error: {
        category: "execution",
        code: "PARSE_FAILED",
        message: `Нет AST для файла: ${ctx.targetPath}`,
        retryable: false,
      },
    };
  }

  const { moduleKind, imports, exports } = extractImportExport(
    sourceFile.ast,
    ctx.targetPath,
  );

  sourceFile.moduleKind = moduleKind;
  // Preserve language from language-backend (javascript | typescript); do not overwrite.
  ctx.projectModel.files[ctx.targetPath] = sourceFile;
  ctx.projectModel.imports = imports;
  ctx.projectModel.exports = exports;

  return {
    inspectorId: "import-export-analysis",
    status: "ok",
    data: {
      moduleKind,
      imports,
      exports,
    },
  };
}

/** @type {Inspector} */
export const importExportAnalysisInspector = {
  meta: {
    id: "import-export-analysis",
    version: "0.0.1",
    tags: ["M"],
  },
  analyze,
};
