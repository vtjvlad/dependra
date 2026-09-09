/**
 * Visualization inspector (S05) — docs/20-features/analysis/visualization.md
 */

import { basename, dirname, relative } from "node:path";
import { loadSourceFile, ParserError } from "../parsers/index.js";
import { extractImportExport } from "./import-export-analysis.js";
import { findProjectRoot, listJavaScriptFiles } from "./scan-js-files.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

const MAX_IMPORT_DEPTH = 3;

/**
 * @param {string|null} absPath
 * @param {string} fallback
 * @param {"name"|"relative"|"absolute"} pathMode
 * @param {string} cwd
 */
function formatDisplay(absPath, fallback, pathMode, cwd) {
  if (!absPath) return fallback;
  if (pathMode === "name") return basename(absPath);
  if (pathMode === "absolute") return absPath;
  const rel = relative(cwd, absPath);
  return rel.startsWith("..") ? absPath : rel;
}

/**
 * @param {string} id
 * @returns {string}
 */
function escapeMermaid(id) {
  return id.replace(/"/g, "#quot;").replace(/[\[\]]/g, "_");
}

/**
 * @param {string} id
 * @returns {string}
 */
function escapeDot(id) {
  return id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * @param {{ id: string, kind: string }[]} nodes
 * @param {{ from: string, to: string, type: string }[]} edges
 * @returns {string}
 */
function toMermaid(nodes, edges) {
  const lines = ["graph LR"];
  for (const n of nodes) {
    const safe = escapeMermaid(n.id);
    lines.push(`  N_${hash(n.id)}["${safe}"]`);
  }
  for (const e of edges) {
    lines.push(`  N_${hash(e.from)} --> N_${hash(e.to)}`);
  }
  if (edges.length === 0 && nodes.length === 1) {
    // single node already added
  }
  return `${lines.join("\n")}\n`;
}

/**
 * @param {{ id: string, kind: string }[]} nodes
 * @param {{ from: string, to: string, type: string }[]} edges
 * @returns {string}
 */
function toDot(nodes, edges) {
  const lines = ["digraph G {"];
  for (const n of nodes) {
    lines.push(`  "${escapeDot(n.id)}";`);
  }
  for (const e of edges) {
    lines.push(`  "${escapeDot(e.from)}" -> "${escapeDot(e.to)}";`);
  }
  lines.push("}");
  return `${lines.join("\n")}\n`;
}

/**
 * @param {string} s
 * @returns {string}
 */
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  if (!Array.isArray(ctx.projectModel.imports)) {
    return {
      inspectorId: "visualization",
      status: "error",
      error: {
        category: "configuration",
        code: "MODEL_INCOMPLETE",
        message:
          "В модели нет подготовленных imports (нужен prerequisite import-export)",
        retryable: false,
      },
    };
  }

  const pathMode = ctx.options.pathMode ?? "relative";
  const targetPath = ctx.targetPath;
  const cwd = ctx.cwd;
  const targetId = formatDisplay(targetPath, targetPath, pathMode, cwd);

  /** @type {string[]} */
  const skipped = [];

  // --- dependency graph (local edges around target + external leaves) ---
  /** @type {Map<string, { id: string, kind: string }>} */
  const depNodes = new Map();
  /** @type {{ from: string, to: string, type: string }[]} */
  const depEdges = [];
  depNodes.set(targetId, { id: targetId, kind: "local" });

  for (const imp of ctx.projectModel.imports) {
    const type =
      imp.kind === "dynamic"
        ? "dynamic"
        : imp.kind === "re-export"
          ? "re-export"
          : "import";
    if (imp.isExternal) {
      const id = imp.source ?? "(external)";
      depNodes.set(id, { id, kind: "external" });
      depEdges.push({ from: targetId, to: id, type });
    } else if (imp.resolvedPath) {
      const id = formatDisplay(imp.resolvedPath, imp.source, pathMode, cwd);
      depNodes.set(id, { id, kind: "local" });
      depEdges.push({ from: targetId, to: id, type });
    }
  }

  // --- import tree BFS depth <= 3 ---
  /** @type {Map<string, { id: string, kind: string }>} */
  const treeNodes = new Map();
  /** @type {{ from: string, to: string, type: string }[]} */
  const treeEdges = [];
  treeNodes.set(targetId, { id: targetId, kind: "local" });

  /** @type {{ path: string, id: string, depth: number }[]} */
  const queue = [{ path: targetPath, id: targetId, depth: 0 }];
  /** @type {Set<string>} */
  const seen = new Set([targetPath]);

  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur || cur.depth >= MAX_IMPORT_DEPTH) {
      if (cur && cur.depth >= MAX_IMPORT_DEPTH) {
        const trunc = "…";
        if (!treeNodes.has(trunc)) treeNodes.set(trunc, { id: trunc, kind: "local" });
        treeEdges.push({ from: cur.id, to: trunc, type: "import" });
      }
      continue;
    }

    let imports;
    if (cur.path === targetPath) {
      imports = ctx.projectModel.imports;
    } else {
      try {
        const sf = await loadSourceFile(cur.path, cwd);
        imports = extractImportExport(sf.ast, cur.path).imports;
      } catch (err) {
        if (err instanceof ParserError) skipped.push(cur.path);
        else skipped.push(cur.path);
        continue;
      }
    }

    for (const imp of imports) {
      const type = imp.kind === "dynamic" ? "dynamic" : "import";
      if (imp.isExternal) {
        const id = imp.source ?? "(external)";
        treeNodes.set(id, { id, kind: "external" });
        treeEdges.push({ from: cur.id, to: id, type });
        continue;
      }
      if (!imp.resolvedPath) continue;
      const id = formatDisplay(imp.resolvedPath, imp.source, pathMode, cwd);
      treeNodes.set(id, { id, kind: "local" });
      treeEdges.push({ from: cur.id, to: id, type });
      if (!seen.has(imp.resolvedPath) && cur.depth + 1 < MAX_IMPORT_DEPTH) {
        seen.add(imp.resolvedPath);
        queue.push({
          path: imp.resolvedPath,
          id,
          depth: cur.depth + 1,
        });
      } else if (
        !seen.has(imp.resolvedPath) &&
        cur.depth + 1 >= MAX_IMPORT_DEPTH
      ) {
        const trunc = "…";
        treeNodes.set(trunc, { id: trunc, kind: "local" });
        treeEdges.push({ from: id, to: trunc, type: "import" });
      }
    }
  }

  // --- export consumers (importedBy) ---
  /** @type {Map<string, { id: string, kind: string }>} */
  const consNodes = new Map();
  /** @type {{ from: string, to: string, type: string }[]} */
  const consEdges = [];
  consNodes.set(targetId, { id: targetId, kind: "local" });

  let root;
  try {
    root = findProjectRoot(dirname(targetPath), cwd);
  } catch (err) {
    return {
      inspectorId: "visualization",
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
      inspectorId: "visualization",
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

  for (const candidate of candidates) {
    if (candidate === targetPath) continue;
    try {
      const sf = await loadSourceFile(candidate, cwd);
      const { imports } = extractImportExport(sf.ast, candidate);
      const hits = imports.some(
        (imp) => imp.resolvedPath && imp.resolvedPath === targetPath,
      );
      if (hits) {
        const id = formatDisplay(candidate, candidate, pathMode, cwd);
        consNodes.set(id, { id, kind: "local" });
        consEdges.push({ from: id, to: targetId, type: "import" });
      }
    } catch {
      skipped.push(candidate);
    }
  }

  const views = {
    dependencyGraph: {
      nodes: [...depNodes.values()],
      edges: depEdges,
    },
    importTree: {
      root: targetId,
      nodes: [...treeNodes.values()],
      edges: treeEdges,
    },
    exportConsumers: {
      root: targetId,
      nodes: [...consNodes.values()],
      edges: consEdges,
    },
  };

  /** @type {object} */
  const formats = {};
  if (ctx.options.mermaid) {
    formats.mermaid = {
      dependencyGraph: toMermaid(views.dependencyGraph.nodes, views.dependencyGraph.edges),
      importTree: toMermaid(views.importTree.nodes, views.importTree.edges),
      exportConsumers: toMermaid(
        views.exportConsumers.nodes,
        views.exportConsumers.edges,
      ),
    };
  }
  if (ctx.options.graphviz) {
    formats.graphviz = {
      dependencyGraph: toDot(views.dependencyGraph.nodes, views.dependencyGraph.edges),
      importTree: toDot(views.importTree.nodes, views.importTree.edges),
      exportConsumers: toDot(
        views.exportConsumers.nodes,
        views.exportConsumers.edges,
      ),
    };
  }
  if (ctx.options.vizJson) {
    formats.json = views;
  }

  return {
    inspectorId: "visualization",
    status: "ok",
    data: {
      pathMode,
      views: ["dependency-graph", "import-tree", "export-consumers"],
      formats,
      skipped,
    },
  };
}

/** @type {Inspector} */
export const visualizationInspector = {
  meta: {
    id: "visualization",
    version: "0.0.1",
    tags: ["E"],
  },
  analyze,
};
