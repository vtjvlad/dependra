/**
 * @typedef {import('../core/types.js').AnalysisReport} AnalysisReport
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

/**
 * JSON-отчёт целиком в stdout-строку (pretty).
 *
 * @param {AnalysisReport} report
 * @returns {string}
 */
export function formatJsonReport(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

/**
 * @param {InspectorResult} result
 * @param {object} options
 * @returns {string[]}
 */
function formatBasicSection(result) {
  if (result.status === "error") {
    return [
      "# basic",
      `error: ${result.error?.code}: ${result.error?.message}`,
    ];
  }
  const d = result.data ?? {};
  return [
    "# basic",
    `name: ${d.name}`,
    `ext: ${d.ext}`,
    `format: ${d.format}`,
    `mimeType: ${d.mimeType}`,
    `size: ${d.size}`,
    `createdAt: ${d.createdAt}`,
    `modifiedAt: ${d.modifiedAt}`,
    `accessedAt: ${d.accessedAt}`,
    `owner: ${d.owner}`,
    `group: ${d.group}`,
    `language: ${d.language}`,
    `engine: ${d.engine}`,
    `fileType: ${d.fileType}`,
  ];
}

/**
 * @param {InspectorResult} result
 * @param {boolean} showImports
 * @param {boolean} showExports
 * @returns {string[]}
 */
function formatImportExportSections(result, showImports, showExports) {
  /** @type {string[]} */
  const lines = [];
  if (result.status === "error") {
    if (showImports) {
      lines.push(
        "# imports",
        `error: ${result.error?.code}: ${result.error?.message}`,
      );
    }
    if (showExports) {
      lines.push(
        "# exports",
        `error: ${result.error?.code}: ${result.error?.message}`,
      );
    }
    return lines;
  }
  const data = result.data ?? {};
  if (showImports) {
    lines.push("# imports");
    const imports = Array.isArray(data.imports) ? data.imports : [];
    if (imports.length === 0) {
      lines.push("(none)");
    } else {
      for (const imp of imports) {
        const src = imp.source ?? "(dynamic)";
        const tag = imp.isExternal ? " [external]" : "";
        lines.push(`- ${src}${tag}`);
      }
    }
  }
  if (showExports) {
    lines.push("# exports");
    const exports = Array.isArray(data.exports) ? data.exports : [];
    if (exports.length === 0) {
      lines.push("(none)");
    } else {
      for (const exp of exports) {
        const name = exp.name ?? "*";
        const from = exp.from ? ` from ${exp.from}` : "";
        lines.push(`- ${exp.kind}: ${name}${from}`);
      }
    }
  }
  return lines;
}

/**
 * @param {InspectorResult} result
 * @returns {string[]}
 */
function formatGraphSection(result) {
  if (result.status === "error") {
    return [
      "# graph",
      `error: ${result.error?.code}: ${result.error?.message}`,
    ];
  }
  const data = result.data ?? {};
  const left = Array.isArray(data.importedBy) ? data.importedBy : [];
  const right = Array.isArray(data.imports) ? data.imports : [];
  const rows = Math.max(left.length, right.length, 1);
  const leftW = Math.max(
    "imported-by".length,
    ...left.map((x) => String(x.display).length),
    1,
  );
  const rightW = Math.max(
    "imports".length,
    ...right.map((x) => String(x.display).length),
    1,
  );

  /** @type {string[]} */
  const lines = ["# graph"];
  lines.push(
    `${"imported-by".padEnd(leftW)}  ${"imports".padEnd(rightW)}`,
  );
  lines.push(`${"-".repeat(leftW)}  ${"-".repeat(rightW)}`);
  for (let i = 0; i < rows; i += 1) {
    const l = left[i]?.display ?? "";
    const r = right[i]?.display ?? "";
    lines.push(`${String(l).padEnd(leftW)}  ${String(r).padEnd(rightW)}`);
  }
  return lines;
}

/**
 * Текстовый отчёт по секциям включённых операций.
 *
 * @param {AnalysisReport} report
 * @returns {string}
 */
export function formatTextReport(report) {
  const opts = report.options ?? {};
  /** @type {string[]} */
  const lines = [
    `dependra ${report.version}`,
    `target: ${report.target}`,
    `cwd: ${report.cwd}`,
    "",
  ];

  const basic = report.results["basic-file-information"];
  if (opts.basic && basic) {
    lines.push(...formatBasicSection(basic), "");
  }

  const ie = report.results["import-export-analysis"];
  if (ie && (opts.imports || opts.exports)) {
    lines.push(
      ...formatImportExportSections(ie, Boolean(opts.imports), Boolean(opts.exports)),
      "",
    );
  }

  const graph = report.results["dependency-analysis"];
  if (opts.graph && graph) {
    lines.push(...formatGraphSection(graph), "");
  }

  if (report.prerequisiteErrors?.length) {
    lines.push("prerequisite errors:");
    for (const msg of report.prerequisiteErrors) {
      lines.push(`  ${msg}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

/**
 * @param {AnalysisReport} report
 * @param {{ json?: boolean }} [opts]
 * @returns {string}
 */
export function formatReport(report, opts = {}) {
  if (opts.json) return formatJsonReport(report);
  return formatTextReport(report);
}
