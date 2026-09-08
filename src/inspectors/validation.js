import { basename, dirname, relative } from "node:path";
import { ensureTargetSourceFile, loadSourceFile, ParserError } from "../parsers/index.js";
import { extractImportExport } from "./import-export-analysis.js";
import { resolveSpecifier } from "./resolve-specifier.js";
import { findProjectRoot, listJavaScriptFiles } from "./scan-js-files.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

/**
 * @param {string|null} absPath
 * @param {string} fallbackDisplay
 * @param {"name"|"relative"|"absolute"} pathMode
 * @param {string} cwd
 * @returns {string}
 */
function formatDisplay(absPath, fallbackDisplay, pathMode, cwd) {
  if (!absPath) return fallbackDisplay;
  if (pathMode === "name") return basename(absPath);
  if (pathMode === "absolute") return absPath;
  const rel = relative(cwd, absPath);
  return rel.startsWith("..") ? absPath : rel;
}

/**
 * @param {object|null|undefined} node
 * @returns {{ line: number, column: number }|null}
 */
function locOf(node) {
  if (!node?.loc?.start) return null;
  return { line: node.loc.start.line, column: node.loc.start.column };
}

/**
 * Локальные имена binding'ов одного ImportDeclaration.
 * Пустой массив = side-effect import.
 *
 * @param {object} node ImportDeclaration
 * @returns {string[]}
 */
function importLocalNames(node) {
  /** @type {string[]} */
  const names = [];
  for (const spec of node.specifiers ?? []) {
    if (spec.local?.type === "Identifier" && spec.local.name) {
      names.push(spec.local.name);
    }
  }
  return names;
}

/**
 * Собрать идентификаторы, использованные вне import/export-from деклараций.
 * Binding-позиции (объявления) не считаются использованием.
 *
 * @param {object} ast
 * @returns {Set<string>}
 */
function collectUsedIdentifiers(ast) {
  /** @type {Set<string>} */
  const used = new Set();

  /**
   * @param {object|null|undefined} node
   */
  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (node.type === "ImportDeclaration") {
      return;
    }

    if (
      (node.type === "ExportNamedDeclaration" ||
        node.type === "ExportAllDeclaration") &&
      node.source
    ) {
      return;
    }

    if (node.type === "VariableDeclarator") {
      walk(node.init);
      return;
    }

    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      walk(node.body);
      return;
    }

    if (node.type === "ClassDeclaration" || node.type === "ClassExpression") {
      walk(node.superClass);
      walk(node.body);
      return;
    }

    if (node.type === "CatchClause") {
      walk(node.body);
      return;
    }

    if (node.type === "ObjectPattern" || node.type === "ArrayPattern") {
      return;
    }

    if (node.type === "Identifier") {
      used.add(node.name);
      return;
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
  return used;
}

/**
 * Записи импортов с локальными именами (для unused).
 *
 * @param {object} ast
 * @param {string} filePath
 * @returns {{
 *   source: string|null,
 *   kind: string,
 *   resolvedPath: string|null,
 *   isExternal: boolean,
 *   loc: {line:number,column:number}|null,
 *   localNames: string[],
 *   sideEffect: boolean,
 * }[]}
 */
function extractImportsWithLocals(ast, filePath) {
  /** @type {ReturnType<typeof extractImportsWithLocals>} */
  const out = [];

  /**
   * @param {object|null|undefined} node
   */
  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (node.type === "ImportDeclaration") {
      const source =
        node.source?.type === "Literal" && typeof node.source.value === "string"
          ? node.source.value
          : null;
      if (source != null) {
        const { isExternal, resolvedPath } = resolveSpecifier(source, filePath);
        const localNames = importLocalNames(node);
        out.push({
          source,
          kind: "static",
          resolvedPath,
          isExternal,
          loc: locOf(node),
          localNames,
          sideEffect: localNames.length === 0,
        });
      }
      return;
    }

    if (node.type === "VariableDeclarator") {
      const init = node.init;
      if (
        init?.type === "CallExpression" &&
        init.callee?.type === "Identifier" &&
        init.callee.name === "require" &&
        init.arguments?.[0]?.type === "Literal" &&
        typeof init.arguments[0].value === "string"
      ) {
        const source = init.arguments[0].value;
        const { isExternal, resolvedPath } = resolveSpecifier(source, filePath);
        /** @type {string[]} */
        const localNames = [];
        if (node.id?.type === "Identifier") {
          localNames.push(node.id.name);
        } else if (node.id?.type === "ObjectPattern") {
          for (const prop of node.id.properties ?? []) {
            if (prop.type === "Property" && prop.value?.type === "Identifier") {
              localNames.push(prop.value.name);
            }
          }
        }
        out.push({
          source,
          kind: "require",
          resolvedPath,
          isExternal,
          loc: locOf(node),
          localNames,
          sideEffect: localNames.length === 0,
        });
      }
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
  return out;
}

/**
 * Какие экспорты цели потребляет импортёр (по AST).
 * `all: true` — namespace / require целиком / default+named неизвестно.
 *
 * @param {object} ast
 * @param {string} fromFile
 * @param {string} targetPath
 * @returns {{ all: boolean, names: Set<string>, usesDefault: boolean }}
 */
function consumerUsageOfTarget(ast, fromFile, targetPath) {
  /** @type {Set<string>} */
  const names = new Set();
  let all = false;
  let usesDefault = false;

  /**
   * @param {object|null|undefined} node
   */
  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (node.type === "ImportDeclaration") {
      const source =
        node.source?.type === "Literal" && typeof node.source.value === "string"
          ? node.source.value
          : null;
      if (source != null) {
        const { resolvedPath } = resolveSpecifier(source, fromFile);
        if (resolvedPath === targetPath) {
          const specs = node.specifiers ?? [];
          if (specs.length === 0) {
            // side-effect — не использует имена экспортов
          } else {
            for (const spec of specs) {
              if (spec.type === "ImportNamespaceSpecifier") {
                all = true;
              } else if (spec.type === "ImportDefaultSpecifier") {
                usesDefault = true;
              } else if (spec.type === "ImportSpecifier") {
                const n =
                  spec.imported?.type === "Identifier"
                    ? spec.imported.name
                    : null;
                if (n) names.add(n);
              }
            }
          }
        }
      }
    }

    if (node.type === "ExportNamedDeclaration" && node.source) {
      const source =
        node.source?.type === "Literal" && typeof node.source.value === "string"
          ? node.source.value
          : null;
      if (source != null) {
        const { resolvedPath } = resolveSpecifier(source, fromFile);
        if (resolvedPath === targetPath) {
          for (const spec of node.specifiers ?? []) {
            const n =
              spec.local?.type === "Identifier" ? spec.local.name : null;
            if (n) names.add(n);
          }
        }
      }
    }

    if (node.type === "ExportAllDeclaration" && node.source) {
      const source =
        node.source?.type === "Literal" && typeof node.source.value === "string"
          ? node.source.value
          : null;
      if (source != null) {
        const { resolvedPath } = resolveSpecifier(source, fromFile);
        if (resolvedPath === targetPath) {
          all = true;
        }
      }
    }

    if (
      node.type === "CallExpression" &&
      node.callee?.type === "Identifier" &&
      node.callee.name === "require" &&
      node.arguments?.[0]?.type === "Literal" &&
      typeof node.arguments[0].value === "string"
    ) {
      const source = node.arguments[0].value;
      const { resolvedPath } = resolveSpecifier(source, fromFile);
      if (resolvedPath === targetPath) {
        all = true;
      }
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
  return { all, names, usesDefault };
}

/**
 * Канонический цикл: ротация так, что первый узел — min path; замкнуть.
 *
 * @param {string[]} cycleNodes узлы без повтора замыкания
 * @returns {string[]}
 */
function canonicalizeCycle(cycleNodes) {
  if (cycleNodes.length === 0) return [];
  let minIdx = 0;
  for (let i = 1; i < cycleNodes.length; i += 1) {
    if (cycleNodes[i] < cycleNodes[minIdx]) minIdx = i;
  }
  const rotated = [
    ...cycleNodes.slice(minIdx),
    ...cycleNodes.slice(0, minIdx),
  ];
  return [...rotated, rotated[0]];
}

/**
 * Найти уникальные циклы, содержащие target (DFS).
 *
 * @param {Map<string, Set<string>>} adj
 * @param {string} targetPath
 * @returns {string[][]}
 */
function findCyclesThroughTarget(adj, targetPath) {
  /** @type {Map<string, string[]>} key = canonical joined paths */
  const found = new Map();

  /**
   * @param {string} node
   * @param {string[]} stack
   * @param {Set<string>} inStack
   */
  function dfs(node, stack, inStack) {
    const neighbors = adj.get(node);
    if (!neighbors) return;
    for (const next of neighbors) {
      if (inStack.has(next)) {
        const idx = stack.indexOf(next);
        if (idx >= 0) {
          const cycle = stack.slice(idx);
          if (cycle.includes(targetPath)) {
            const canon = canonicalizeCycle(cycle);
            found.set(canon.join("\0"), canon);
          }
        }
        continue;
      }
      if (!adj.has(next) && next !== targetPath) {
        // leaf outside map — still allow edge into known nodes only
      }
      stack.push(next);
      inStack.add(next);
      dfs(next, stack, inStack);
      stack.pop();
      inStack.delete(next);
    }
  }

  // Start from target only — cycles through target appear as back-edges
  dfs(targetPath, [targetPath], new Set([targetPath]));

  // Also explore nodes that can reach target by starting walks that hit target
  // via edges into the component: walk all nodes that have path to/from target
  // Simpler: for every node in adj, if we can reach target and target can reach it —
  // DFS from target already finds cycles containing target if we also follow
  // into the full graph. Starting only from target finds A→B→A when target is A.
  // When target is B in A→B→A: from B we go to A then to B — found.
  return [...found.values()];
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  if (!Array.isArray(ctx.projectModel.imports)) {
    return {
      inspectorId: "validation",
      status: "error",
      error: {
        category: "configuration",
        code: "MODEL_INCOMPLETE",
        message:
          "В модели нет подготовленных imports (нужен prerequisite import-export-analysis)",
        retryable: false,
      },
    };
  }

  const pathMode = ctx.options.pathMode ?? "relative";
  const targetPath = ctx.targetPath;
  const cwd = ctx.cwd;

  /** @type {object[]} */
  const diagnostics = [];
  /** @type {string[]} */
  const skipped = [];

  // --- Broken imports (from model imports) ---
  for (const imp of ctx.projectModel.imports) {
    if (imp.isExternal) continue;
    if (imp.source == null) continue;
    if (imp.resolvedPath != null) continue;
    diagnostics.push({
      code: "BROKEN_IMPORT",
      severity: "error",
      message: "Импорт указывает на отсутствующий файл",
      source: imp.source,
      resolvedPath: null,
      display: imp.source,
      loc: imp.loc ?? null,
    });
  }

  // --- Unused imports (AST locals) ---
  let sourceFile;
  try {
    sourceFile = await ensureTargetSourceFile(ctx);
  } catch (err) {
    if (err instanceof ParserError) {
      return {
        inspectorId: "validation",
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
      inspectorId: "validation",
      status: "error",
      error: {
        category: "execution",
        code: "PARSE_FAILED",
        message: `Нет AST для файла: ${targetPath}`,
        retryable: false,
      },
    };
  }

  const usedIds = collectUsedIdentifiers(sourceFile.ast);
  const detailedImports = extractImportsWithLocals(sourceFile.ast, targetPath);
  for (const imp of detailedImports) {
    if (imp.sideEffect) continue;
    if (imp.kind === "dynamic" && imp.source == null) continue;
    const unusedLocals = imp.localNames.filter((n) => !usedIds.has(n));
    // Весь импорт unused, если ни одно локальное имя не используется
    if (unusedLocals.length === imp.localNames.length && imp.localNames.length > 0) {
      diagnostics.push({
        code: "UNUSED_IMPORT",
        severity: "warning",
        message: "Импорт не используется",
        source: imp.source,
        resolvedPath: imp.resolvedPath,
        display: formatDisplay(
          imp.resolvedPath,
          imp.source ?? "(import)",
          pathMode,
          cwd,
        ),
        loc: imp.loc,
      });
    }
  }

  // --- Project scan: graph for cycles + unused exports ---
  let root;
  try {
    root = findProjectRoot(dirname(targetPath), cwd);
  } catch (err) {
    return {
      inspectorId: "validation",
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

  let candidates;
  try {
    candidates = listJavaScriptFiles(root);
  } catch (err) {
    return {
      inspectorId: "validation",
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

  /** @type {Map<string, Set<string>>} */
  const adj = new Map();
  /**
   * @param {string} from
   * @param {string} to
   */
  function addEdge(from, to) {
    if (!adj.has(from)) adj.set(from, new Set());
    adj.get(from).add(to);
  }

  /** @type {{ all: boolean, names: Set<string>, usesDefault: boolean }} */
  const consumed = { all: false, names: new Set(), usesDefault: false };

  for (const candidate of candidates) {
    try {
      const sf =
        candidate === targetPath
          ? sourceFile
          : await loadSourceFile(candidate, cwd);
      const { imports } = extractImportExport(sf.ast, candidate);
      for (const imp of imports) {
        if (imp.resolvedPath && !imp.isExternal) {
          addEdge(candidate, imp.resolvedPath);
        }
      }

      if (candidate !== targetPath) {
        const usage = consumerUsageOfTarget(sf.ast, candidate, targetPath);
        if (usage.all) consumed.all = true;
        if (usage.usesDefault) consumed.usesDefault = true;
        for (const n of usage.names) consumed.names.add(n);
      }
    } catch (err) {
      if (err instanceof ParserError) {
        skipped.push(
          formatDisplay(candidate, candidate, pathMode, cwd),
        );
        continue;
      }
      skipped.push(formatDisplay(candidate, candidate, pathMode, cwd));
    }
  }

  // Ensure target node exists in adj
  if (!adj.has(targetPath)) adj.set(targetPath, new Set());

  const cycles = findCyclesThroughTarget(adj, targetPath);
  for (const cycle of cycles) {
    diagnostics.push({
      code: "CYCLE",
      severity: "error",
      message: "Циклическая зависимость",
      paths: cycle.map((p) => formatDisplay(p, p, pathMode, cwd)),
      loc: null,
    });
  }

  // --- Unused exports ---
  const exportsList = Array.isArray(ctx.projectModel.exports)
    ? ctx.projectModel.exports
    : [];

  if (!consumed.all) {
    for (const exp of exportsList) {
      if (exp.kind === "all") continue;
      if (exp.kind === "default") {
        if (!consumed.usesDefault) {
          diagnostics.push({
            code: "UNUSED_EXPORT",
            severity: "warning",
            message: "Экспорт не используется в проекте",
            name: "default",
            exportKind: "default",
            display: "default",
            loc: exp.loc ?? null,
          });
        }
        continue;
      }
      const name = exp.name;
      if (name == null) continue;
      if (!consumed.names.has(name)) {
        diagnostics.push({
          code: "UNUSED_EXPORT",
          severity: "warning",
          message: "Экспорт не используется в проекте",
          name,
          exportKind: exp.kind ?? "named",
          display: name,
          loc: exp.loc ?? null,
        });
      }
    }
  }

  const severityRank = { error: 0, warning: 1, info: 2 };
  diagnostics.sort((a, b) => {
    const sa = severityRank[a.severity] ?? 9;
    const sb = severityRank[b.severity] ?? 9;
    if (sa !== sb) return sa - sb;
    const la = a.loc?.line ?? Number.MAX_SAFE_INTEGER;
    const lb = b.loc?.line ?? Number.MAX_SAFE_INTEGER;
    if (la !== lb) return la - lb;
    return String(a.code).localeCompare(String(b.code));
  });

  /** @type {{ error: number, warning: number, info: number }} */
  const summary = { error: 0, warning: 0, info: 0 };
  for (const d of diagnostics) {
    if (d.severity === "error") summary.error += 1;
    else if (d.severity === "warning") summary.warning += 1;
    else summary.info += 1;
  }

  return {
    inspectorId: "validation",
    status: "ok",
    data: {
      pathMode,
      summary,
      diagnostics,
      skipped,
    },
  };
}

/** @type {Inspector} */
export const validationInspector = {
  meta: {
    id: "validation",
    version: "0.0.1",
    tags: ["D"],
  },
  analyze,
};
