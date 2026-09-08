import { relative } from "node:path";
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
 * @param {string|null} absPath
 * @param {string} name
 * @param {"name"|"relative"|"absolute"} pathMode
 * @param {string} cwd
 * @returns {string}
 */
function importedDisplay(absPath, name, pathMode, cwd) {
  if (pathMode === "name") return name;
  if (!absPath) return name;
  if (pathMode === "absolute") return absPath;
  const rel = relative(cwd, absPath);
  return rel.startsWith("..") ? absPath : rel;
}

/**
 * @param {object} decl
 * @returns {"function"|"class"|"variable"|"unknown"}
 */
function kindFromDeclaration(decl) {
  if (!decl) return "unknown";
  if (decl.type === "FunctionDeclaration") return "function";
  if (decl.type === "ClassDeclaration") return "class";
  if (decl.type === "VariableDeclaration") return "variable";
  return "unknown";
}

/**
 * @param {object} ast
 * @param {string} filePath
 * @param {string} cwd
 * @param {"name"|"relative"|"absolute"} pathMode
 * @returns {{ exported: object[], imported: object[] }}
 */
export function extractEntities(ast, filePath, cwd, pathMode) {
  /** @type {object[]} */
  const exported = [];
  /** @type {object[]} */
  const imported = [];

  /**
   * @param {object|null|undefined} node
   */
  function walk(node) {
    if (!node || typeof node !== "object") return;

    switch (node.type) {
      case "ExportNamedDeclaration": {
        if (node.declaration) {
          const decl = node.declaration;
          if (
            decl.type === "FunctionDeclaration" ||
            decl.type === "ClassDeclaration"
          ) {
            exported.push({
              kind: kindFromDeclaration(decl),
              name: decl.id?.name ?? null,
              display: decl.id?.name ?? "default",
              loc: locOf(decl),
            });
          } else if (decl.type === "VariableDeclaration") {
            for (const d of decl.declarations) {
              if (d.id?.type === "Identifier") {
                exported.push({
                  kind: "variable",
                  name: d.id.name,
                  display: d.id.name,
                  loc: locOf(d),
                });
              }
            }
          }
        }
        if (Array.isArray(node.specifiers)) {
          for (const spec of node.specifiers) {
            const name =
              spec.exported?.type === "Identifier"
                ? spec.exported.name
                : null;
            exported.push({
              kind: "unknown",
              name,
              display: name ?? "*",
              loc: locOf(spec),
            });
          }
        }
        break;
      }
      case "ExportDefaultDeclaration": {
        const decl = node.declaration;
        let kind = "unknown";
        if (decl?.type === "FunctionDeclaration" || decl?.type === "FunctionExpression") {
          kind = "function";
        } else if (
          decl?.type === "ClassDeclaration" ||
          decl?.type === "ClassExpression"
        ) {
          kind = "class";
        } else if (decl?.type === "Identifier") {
          kind = "unknown";
        }
        exported.push({
          kind,
          name: "default",
          display: "default",
          loc: locOf(node),
        });
        break;
      }
      case "ExportAllDeclaration": {
        exported.push({
          kind: "unknown",
          name: node.exported?.name ?? "*",
          display: node.exported?.name ?? "*",
          loc: locOf(node),
        });
        break;
      }
      case "ImportDeclaration": {
        const from =
          node.source?.type === "Literal" &&
          typeof node.source.value === "string"
            ? node.source.value
            : null;
        const resolved = resolveSpecifier(from, filePath);
        for (const spec of node.specifiers ?? []) {
          if (spec.type === "ImportNamespaceSpecifier") {
            imported.push({
              kind: "unknown",
              name: "*",
              display: importedDisplay(
                resolved.resolvedPath,
                "*",
                pathMode,
                cwd,
              ),
              from,
              resolvedPath: resolved.resolvedPath,
              loc: locOf(spec),
            });
            continue;
          }
          const local =
            spec.local?.type === "Identifier" ? spec.local.name : null;
          let kind = "variable";
          if (spec.type === "ImportDefaultSpecifier") {
            kind = local && /^[A-Z]/.test(local) ? "class" : "function";
          } else if (spec.type === "ImportSpecifier") {
            kind = local && /^[A-Z]/.test(local) ? "class" : "function";
          }
          imported.push({
            kind,
            name: local,
            display: importedDisplay(
              resolved.resolvedPath,
              local ?? "default",
              pathMode,
              cwd,
            ),
            from,
            resolvedPath: resolved.resolvedPath,
            loc: locOf(spec),
          });
        }
        break;
      }
      case "AssignmentExpression": {
        // exports.foo = ... / module.exports = ...
        const left = node.left;
        if (
          left?.type === "MemberExpression" &&
          left.object?.type === "Identifier" &&
          left.object.name === "exports" &&
          !left.computed &&
          left.property?.type === "Identifier"
        ) {
          const name = left.property.name;
          const right = node.right;
          let kind = "variable";
          if (
            right?.type === "FunctionExpression" ||
            right?.type === "ArrowFunctionExpression"
          ) {
            kind = "function";
          } else if (right?.type === "ClassExpression") {
            kind = "class";
          }
          exported.push({
            kind,
            name,
            display: name,
            loc: locOf(node),
          });
        }
        break;
      }
      case "VariableDeclarator": {
        // const x = require('...')
        if (
          node.id?.type === "Identifier" &&
          node.init?.type === "CallExpression" &&
          node.init.callee?.type === "Identifier" &&
          node.init.callee.name === "require"
        ) {
          const arg = node.init.arguments?.[0];
          const from =
            arg?.type === "Literal" && typeof arg.value === "string"
              ? arg.value
              : null;
          const resolved = resolveSpecifier(from, filePath);
          imported.push({
            kind: "unknown",
            name: node.id.name,
            display: importedDisplay(
              resolved.resolvedPath,
              node.id.name,
              pathMode,
              cwd,
            ),
            from,
            resolvedPath: resolved.resolvedPath,
            loc: locOf(node),
          });
        }
        // const { a } = require('...')
        if (
          node.id?.type === "ObjectPattern" &&
          node.init?.type === "CallExpression" &&
          node.init.callee?.type === "Identifier" &&
          node.init.callee.name === "require"
        ) {
          const arg = node.init.arguments?.[0];
          const from =
            arg?.type === "Literal" && typeof arg.value === "string"
              ? arg.value
              : null;
          const resolved = resolveSpecifier(from, filePath);
          for (const prop of node.id.properties ?? []) {
            const name =
              prop.value?.type === "Identifier"
                ? prop.value.name
                : prop.key?.type === "Identifier"
                  ? prop.key.name
                  : null;
            if (!name) continue;
            imported.push({
              kind: "variable",
              name,
              display: importedDisplay(
                resolved.resolvedPath,
                name,
                pathMode,
                cwd,
              ),
              from,
              resolvedPath: resolved.resolvedPath,
              loc: locOf(prop),
            });
          }
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
  return { exported, imported };
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  const pathMode = ctx.options.pathMode ?? "relative";
  let sourceFile;
  try {
    sourceFile = await ensureTargetSourceFile(ctx);
  } catch (err) {
    if (err instanceof ParserError) {
      return {
        inspectorId: "exported-entities",
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
      inspectorId: "exported-entities",
      status: "error",
      error: {
        category: "configuration",
        code: "MODEL_INCOMPLETE",
        message: `Нет AST для файла: ${ctx.targetPath}`,
        retryable: false,
      },
    };
  }

  const { exported, imported } = extractEntities(
    sourceFile.ast,
    ctx.targetPath,
    ctx.cwd,
    pathMode,
  );

  return {
    inspectorId: "exported-entities",
    status: "ok",
    data: {
      pathMode,
      exported,
      imported,
    },
  };
}

/** @type {Inspector} */
export const exportedEntitiesInspector = {
  meta: {
    id: "exported-entities",
    version: "0.0.1",
    tags: ["M"],
  },
  analyze,
};
