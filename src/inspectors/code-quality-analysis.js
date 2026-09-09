import { ensureTargetSourceFile, ParserError } from "../parsers/index.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

/**
 * @param {object|null|undefined} node
 * @returns {{ line: number, column: number }|null}
 */
function locOf(node) {
  if (!node?.loc?.start) return null;
  return { line: node.loc.start.line, column: node.loc.start.column };
}

/**
 * @param {number} n
 * @returns {number}
 */
function round3(n) {
  return Math.round(n * 1000) / 1000;
}

/**
 * @param {string} source
 * @returns {{
 *   linesTotal: number,
 *   linesCode: number,
 *   linesComment: number,
 *   linesBlank: number,
 *   linesExcessBlank: number,
 *   excessBlankFindings: { code: string, severity: string, message: string, count: number, loc: object|null }[],
 * }}
 */
function analyzeLines(source) {
  const normalized = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  // trailing empty from final newline is a real empty line in split; keep as-is
  const linesTotal = lines.length;

  let linesBlank = 0;
  let linesComment = 0;
  let linesCode = 0;
  let linesExcessBlank = 0;
  /** @type {ReturnType<typeof analyzeLines>["excessBlankFindings"]} */
  const excessBlankFindings = [];

  let inBlock = false;
  let blankRun = 0;
  /** @type {number|null} */
  let blankRunStart = null;

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const trim = raw.trim();

    if (trim === "") {
      linesBlank += 1;
      if (blankRun === 0) blankRunStart = i + 1;
      blankRun += 1;
      continue;
    }

    if (blankRun >= 2) {
      linesExcessBlank += blankRun - 1;
      excessBlankFindings.push({
        code: "EXCESS_BLANK",
        severity: "info",
        message: "Подряд идущие пустые строки",
        count: blankRun,
        loc: { line: blankRunStart ?? i, column: 0 },
      });
    }
    blankRun = 0;
    blankRunStart = null;

    // block comment tracking (best-effort line scan)
    let rest = trim;
    let onlyComment = false;
    if (inBlock) {
      onlyComment = true;
      const end = rest.indexOf("*/");
      if (end !== -1) {
        inBlock = false;
        rest = rest.slice(end + 2).trim();
        if (rest === "") {
          linesComment += 1;
          continue;
        }
        onlyComment = false;
      } else {
        linesComment += 1;
        continue;
      }
    }

    if (rest.startsWith("//")) {
      linesComment += 1;
      continue;
    }

    if (rest.startsWith("/*")) {
      const end = rest.indexOf("*/", 2);
      if (end === -1) {
        inBlock = true;
        linesComment += 1;
        continue;
      }
      const after = rest.slice(end + 2).trim();
      if (after === "" || after.startsWith("//")) {
        linesComment += 1;
        continue;
      }
      linesCode += 1;
      continue;
    }

    if (onlyComment && rest === "") {
      linesComment += 1;
      continue;
    }

    linesCode += 1;
  }

  if (blankRun >= 2) {
    linesExcessBlank += blankRun - 1;
    excessBlankFindings.push({
      code: "EXCESS_BLANK",
      severity: "info",
      message: "Подряд идущие пустые строки",
      count: blankRun,
      loc: { line: blankRunStart ?? linesTotal, column: 0 },
    });
  }

  return {
    linesTotal,
    linesCode,
    linesComment,
    linesBlank,
    linesExcessBlank,
    excessBlankFindings,
  };
}

/**
 * Использованные идентификаторы (references), binding-позиции пропускаются.
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

    if (node.type === "ImportDeclaration") return;

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

    if (node.type === "Property" && node.key && !node.computed) {
      walk(node.value);
      return;
    }

    if (node.type === "MemberExpression") {
      walk(node.object);
      if (node.computed) walk(node.property);
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
 * @param {object} pattern
 * @param {{ line: number, column: number }|null} fallbackLoc
 * @returns {{ name: string, loc: { line: number, column: number }|null }[]}
 */
function patternBindings(pattern, fallbackLoc) {
  /** @type {{ name: string, loc: { line: number, column: number }|null }[]} */
  const out = [];
  if (!pattern) return out;
  if (pattern.type === "Identifier") {
    out.push({ name: pattern.name, loc: locOf(pattern) ?? fallbackLoc });
    return out;
  }
  if (pattern.type === "AssignmentPattern") {
    return patternBindings(pattern.left, fallbackLoc);
  }
  if (pattern.type === "RestElement") {
    return patternBindings(pattern.argument, fallbackLoc);
  }
  if (pattern.type === "ObjectPattern") {
    for (const prop of pattern.properties ?? []) {
      if (prop.type === "RestElement") {
        out.push(...patternBindings(prop.argument, fallbackLoc));
      } else if (prop.value) {
        out.push(...patternBindings(prop.value, locOf(prop) ?? fallbackLoc));
      }
    }
    return out;
  }
  if (pattern.type === "ArrayPattern") {
    for (const el of pattern.elements ?? []) {
      if (el) out.push(...patternBindings(el, fallbackLoc));
    }
  }
  return out;
}

/**
 * Локальные bindings (не import, не export declaration).
 * @param {object} ast
 * @returns {{ name: string, loc: { line: number, column: number }|null, kind: "var"|"param" }[]}
 */
function collectLocalBindings(ast) {
  /** @type {{ name: string, loc: { line: number, column: number }|null, kind: "var"|"param" }[]} */
  const bindings = [];

  /**
   * @param {object[]} params
   */
  function addParams(params) {
    for (const p of params ?? []) {
      for (const b of patternBindings(p, locOf(p))) {
        if (b.name.startsWith("_")) continue;
        bindings.push({ ...b, kind: "param" });
      }
    }
  }

  /**
   * @param {object|null|undefined} node
   * @param {boolean} inExport
   */
  function walk(node, inExport) {
    if (!node || typeof node !== "object") return;

    if (node.type === "ImportDeclaration") return;

    if (node.type === "ExportNamedDeclaration") {
      if (node.declaration) walk(node.declaration, true);
      return;
    }
    if (node.type === "ExportDefaultDeclaration") {
      walk(node.declaration, true);
      return;
    }
    if (node.type === "ExportAllDeclaration") return;

    if (node.type === "VariableDeclaration") {
      for (const d of node.declarations ?? []) {
        if (inExport) continue;
        for (const b of patternBindings(d.id, locOf(d))) {
          bindings.push({ ...b, kind: "var" });
        }
        walk(d.init, false);
      }
      return;
    }

    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      if (node.type === "FunctionDeclaration" && node.id && !inExport) {
        // function name itself may be unused — treat as local var-like
        bindings.push({
          name: node.id.name,
          loc: locOf(node.id),
          kind: "var",
        });
      }
      addParams(node.params);
      walk(node.body, false);
      return;
    }

    if (node.type === "CatchClause") {
      if (node.param) {
        for (const b of patternBindings(node.param, locOf(node.param))) {
          if (!b.name.startsWith("_")) {
            bindings.push({ ...b, kind: "param" });
          }
        }
      }
      walk(node.body, false);
      return;
    }

    for (const key of Object.keys(node)) {
      if (key === "loc" || key === "range" || key === "start" || key === "end") {
        continue;
      }
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) walk(c, inExport);
      } else if (child && typeof child === "object" && child.type) {
        walk(child, inExport);
      }
    }
  }

  walk(ast, false);
  return bindings;
}

/**
 * @param {object} ast
 * @returns {object[]}
 */
function collectSuspicious(ast) {
  /** @type {object[]} */
  const findings = [];

  /**
   * @param {object|null|undefined} node
   */
  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (node.type === "CallExpression") {
      const callee = node.callee;
      if (callee?.type === "Identifier" && callee.name === "eval") {
        findings.push({
          code: "SUSPICIOUS_EVAL",
          severity: "warning",
          message: "Вызов eval",
          loc: locOf(node),
        });
      }
    }

    if (node.type === "WithStatement") {
      findings.push({
        code: "SUSPICIOUS_WITH",
        severity: "warning",
        message: "Оператор with",
        loc: locOf(node),
      });
    }

    if (node.type === "BinaryExpression") {
      if (node.operator === "==" || node.operator === "!=") {
        const leftNull =
          node.left?.type === "Literal" && node.left.value === null;
        const rightNull =
          node.right?.type === "Literal" && node.right.value === null;
        if (!leftNull && !rightNull) {
          findings.push({
            code: "SUSPICIOUS_EQ",
            severity: "info",
            message: "Использование == / !=",
            loc: locOf(node),
          });
        }
      }
    }

    if (node.type === "CatchClause") {
      const body = node.body;
      const stmts = body?.body ?? [];
      const empty =
        stmts.length === 0 ||
        stmts.every(
          (s) =>
            s.type === "EmptyStatement" ||
            (s.type === "BlockStatement" && (s.body?.length ?? 0) === 0),
        );
      if (empty) {
        findings.push({
          code: "SUSPICIOUS_EMPTY_CATCH",
          severity: "warning",
          message: "Пустой catch",
          loc: locOf(node),
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
  return findings;
}

/**
 * @param {string} source
 * @returns {{ findings: object[], duplicateBlocks: number, duplicateLinesApprox: number }}
 */
function findDuplication(source) {
  const normalized = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawLines = normalized.split("\n");
  /** @type {{ text: string, line: number }[]} */
  const codeLines = [];
  for (let i = 0; i < rawLines.length; i += 1) {
    const t = rawLines[i].trim().replace(/\s+/g, " ");
    if (t === "") continue;
    codeLines.push({ text: t, line: i + 1 });
  }

  const WINDOW = 5;
  /** @type {Map<string, number[]>} */
  const windows = new Map();

  for (let i = 0; i <= codeLines.length - WINDOW; i += 1) {
    const slice = codeLines.slice(i, i + WINDOW);
    const key = slice.map((s) => s.text).join("\n");
    const startLine = slice[0].line;
    if (!windows.has(key)) windows.set(key, []);
    windows.get(key)?.push(startLine);
  }

  /** @type {object[]} */
  const findings = [];
  let duplicateBlocks = 0;
  let duplicateLinesApprox = 0;
  /** @type {Set<string>} */
  const seen = new Set();

  for (const [key, starts] of windows) {
    if (starts.length < 2) continue;
    // skip overlapping windows of same duplicate family: keep unique key once
    if (seen.has(key)) continue;
    seen.add(key);
    duplicateBlocks += 1;
    duplicateLinesApprox += WINDOW;
    const locs = starts.map((line) => ({ line, column: 0 }));
    findings.push({
      code: "DUPLICATE_BLOCK",
      severity: "info",
      message: "Похожий блок кода повторяется",
      linesApprox: WINDOW,
      locs,
      loc: locs[0],
    });
  }

  return { findings, duplicateBlocks, duplicateLinesApprox };
}

/**
 * @param {object[]} findings
 */
function sortFindings(findings) {
  const rank = { error: 0, warning: 1, info: 2 };
  findings.sort((a, b) => {
    const ra = rank[a.severity] ?? 9;
    const rb = rank[b.severity] ?? 9;
    if (ra !== rb) return ra - rb;
    const la = a.loc?.line ?? Number.MAX_SAFE_INTEGER;
    const lb = b.loc?.line ?? Number.MAX_SAFE_INTEGER;
    if (la !== lb) return la - lb;
    return String(a.code).localeCompare(String(b.code));
  });
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  const pathMode = ctx.options.pathMode ?? "relative";

  /** @type {Awaited<ReturnType<typeof ensureTargetSourceFile>>} */
  let sourceFile;
  try {
    sourceFile = await ensureTargetSourceFile(ctx);
  } catch (err) {
    if (err instanceof ParserError) {
      return {
        inspectorId: "code-quality-analysis",
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

  const source = sourceFile.sourceText ?? "";
  const ast = sourceFile.ast;
  const lineStats = analyzeLines(source);
  const used = collectUsedIdentifiers(ast);
  const locals = collectLocalBindings(ast);

  /** @type {object[]} */
  const findings = [...lineStats.excessBlankFindings];

  let localsUnused = 0;
  /** @type {Set<string>} */
  const reportedUnused = new Set();
  for (const b of locals) {
    if (used.has(b.name)) continue;
    if (reportedUnused.has(b.name)) continue;
    reportedUnused.add(b.name);
    localsUnused += 1;
    findings.push({
      code: "UNUSED_LOCAL",
      severity: "warning",
      message: "Локальная переменная не используется",
      name: b.name,
      display: b.name,
      loc: b.loc,
    });
  }

  findings.push(...collectSuspicious(ast));

  const dup = findDuplication(source);
  findings.push(...dup.findings);

  const commentRatio = round3(
    lineStats.linesComment / Math.max(lineStats.linesTotal, 1),
  );
  const localsDeclared = locals.length;
  const unusedLocalRatio = round3(
    localsUnused / Math.max(localsDeclared, 1),
  );

  if (commentRatio < 0.02 && lineStats.linesCode >= 40) {
    findings.push({
      code: "LOW_COMMENT_RATIO",
      severity: "info",
      message: "Низкая доля комментариев",
      loc: null,
    });
  }

  sortFindings(findings);

  let warningCount = 0;
  let infoCount = 0;
  let errorCount = 0;
  for (const f of findings) {
    if (f.severity === "error") errorCount += 1;
    else if (f.severity === "warning") warningCount += 1;
    else infoCount += 1;
  }

  let quality = 100 - 5 * warningCount - 2 * infoCount;
  quality = Math.max(0, Math.min(100, quality));

  let style = 100;
  for (const f of findings) {
    if (f.code === "EXCESS_BLANK" || f.code === "LOW_COMMENT_RATIO") {
      style -= 3;
    } else if (f.code === "SUSPICIOUS_EQ") {
      style -= 4;
    } else if (
      f.code === "SUSPICIOUS_EVAL" ||
      f.code === "SUSPICIOUS_WITH" ||
      f.code === "SUSPICIOUS_EMPTY_CATCH"
    ) {
      style -= 10;
    }
  }
  style = Math.max(0, Math.min(100, style));

  return {
    inspectorId: "code-quality-analysis",
    status: "ok",
    data: {
      pathMode,
      metrics: {
        linesTotal: lineStats.linesTotal,
        linesCode: lineStats.linesCode,
        linesComment: lineStats.linesComment,
        linesBlank: lineStats.linesBlank,
        linesExcessBlank: lineStats.linesExcessBlank,
        commentRatio,
        localsDeclared,
        localsUnused,
        unusedLocalRatio,
        duplicateBlocks: dup.duplicateBlocks,
        duplicateLinesApprox: dup.duplicateLinesApprox,
      },
      scores: {
        quality,
        style,
        scale: "0-100",
        method: "heuristic-s06",
      },
      findings,
      summary: {
        error: errorCount,
        warning: warningCount,
        info: infoCount,
      },
    },
  };
}

/** @type {Inspector} */
export const codeQualityAnalysisInspector = {
  meta: {
    id: "code-quality-analysis",
    version: "0.0.1",
    tags: ["F"],
  },
  analyze,
};
