import { basename } from "node:path";
import {
  createPalette,
  formatBanner,
  formatBytes,
  frameSection,
  shortPath,
  useColor,
  visibleWidth,
} from "./style.js";

/**
 * @typedef {import('../core/types.js').AnalysisReport} AnalysisReport
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 * @typedef {ReturnType<typeof createPalette>} Palette
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
 * @param {AnalysisReport} report
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatBasicSection(result, report, pal) {
  if (result.status === "error") {
    return frameSection(
      "file",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }

  const d = result.data ?? {};
  const rel = shortPath(report.target, report.cwd);
  const bits = [
    d.language,
    d.mimeType,
    typeof d.size === "number" ? formatBytes(d.size) : null,
  ].filter(Boolean);

  /** @type {string[]} */
  const body = [
    pal.bold(String(d.name ?? basename(report.target))),
    pal.dim(rel),
    "",
    bits.map((b) => String(b)).join(pal.dim("  ·  ")),
    [
      d.engine ? pal.cyan(String(d.engine)) : null,
      d.owner != null ? `uid ${d.owner}` : null,
      d.group != null ? `gid ${d.group}` : null,
      d.fileType,
    ]
      .filter(Boolean)
      .join(pal.dim("  ·  ")),
    "",
    `${pal.dim("birth ")} ${d.createdAt ?? "—"}`,
    `${pal.dim("mtime ")} ${d.modifiedAt ?? "—"}`,
    `${pal.dim("atime ")} ${d.accessedAt ?? "—"}`,
  ];

  return frameSection("file", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {boolean} showImports
 * @param {boolean} showExports
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatImportExportSections(result, showImports, showExports, pal) {
  /** @type {string[]} */
  const blocks = [];

  if (showImports) {
    if (result.status === "error") {
      blocks.push(
        ...frameSection(
          "imports",
          [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
          pal,
        ),
        "",
      );
    } else {
      const imports = Array.isArray(result.data?.imports)
        ? result.data.imports
        : [];
      /** @type {string[]} */
      const body = [];
      if (imports.length === 0) {
        body.push(pal.dim("∅  none"));
      } else {
        for (const imp of imports) {
          const src = imp.source ?? pal.dim("(dynamic)");
          const arrow = pal.cyan("→");
          if (imp.isExternal) {
            body.push(
              `${arrow}  ${src}${padTo(src, 28)}${pal.yellow("external")}`,
            );
          } else {
            body.push(`${arrow}  ${src}`);
          }
        }
      }
      const kind = result.data?.moduleKind
        ? `imports · ${result.data.moduleKind}`
        : "imports";
      blocks.push(...frameSection(kind, body, pal), "");
    }
  }

  if (showExports) {
    if (result.status === "error") {
      blocks.push(
        ...frameSection(
          "exports",
          [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
          pal,
        ),
        "",
      );
    } else {
      const exports = Array.isArray(result.data?.exports)
        ? result.data.exports
        : [];
      /** @type {string[]} */
      const body = [];
      if (exports.length === 0) {
        body.push(pal.dim("∅  none"));
      } else {
        for (const exp of exports) {
          const mark =
            exp.kind === "default"
              ? pal.magenta("★")
              : exp.kind === "all"
                ? pal.cyan("✱")
                : exp.kind === "commonjs"
                  ? pal.yellow("◈")
                  : pal.green("◆");
          const name =
            exp.kind === "default"
              ? "default"
              : (exp.name ?? "*");
          const from = exp.from ? pal.dim(`  ← ${exp.from}`) : "";
          const kindTag = pal.dim(String(exp.kind));
          body.push(`${mark}  ${name}${from}${padTo(`${name}${exp.from ? `  ← ${exp.from}` : ""}`, 24)}${kindTag}`);
        }
      }
      blocks.push(...frameSection("exports", body, pal), "");
    }
  }

  return blocks;
}

/**
 * @param {string} text
 * @param {number} width
 * @returns {string}
 */
function padTo(text, width) {
  const w = visibleWidth(String(text));
  return " ".repeat(Math.max(2, width - w));
}

/**
 * Мини-схема потока вокруг целевого файла.
 *
 * @param {string} targetName
 * @param {{ display: string }[]} importedBy
 * @param {{ display: string, isExternal?: boolean }[]} imports
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatFlowSketch(targetName, importedBy, imports, pal) {
  const left = importedBy.slice(0, 4).map((x) => basename(x.display));
  const right = imports.slice(0, 5).map((x) => ({
    name: x.isExternal ? x.display : basename(x.display),
    external: Boolean(x.isExternal),
  }));

  const boxInner = ` ${targetName} `;
  const boxTop = `┌${"─".repeat(boxInner.length)}┐`;
  const boxMid = `│${boxInner}│`;
  const boxBot = `└${"─".repeat(boxInner.length)}┘`;

  /** @type {string[]} */
  const lines = ["", pal.dim("  flow")];

  if (left.length === 0) {
    lines.push(pal.dim("  (no importers found)"));
  } else {
    for (let i = 0; i < left.length; i += 1) {
      const branch = i === left.length - 1 ? "└─" : "├─";
      lines.push(`  ${pal.dim(branch)} ${left[i]}`);
    }
  }

  const stem = left.length > 0 ? pal.cyan("  │") : pal.dim("  ·");
  lines.push(stem);
  lines.push(`${pal.cyan("  ▼")}`);
  lines.push(`  ${pal.bold(boxTop)}`);
  lines.push(`  ${pal.bold(boxMid)}`);
  lines.push(`  ${pal.bold(boxBot)}`);

  if (right.length === 0) {
    lines.push(pal.dim("  (no imports)"));
  } else {
    for (let i = 0; i < right.length; i += 1) {
      const branch = i === right.length - 1 ? "└─→" : "├─→";
      const label = right[i].external
        ? `${right[i].name} ${pal.yellow("ext")}`
        : right[i].name;
      lines.push(`  ${pal.cyan(branch)} ${label}`);
    }
  }

  if (importedBy.length > 4 || imports.length > 5) {
    lines.push(pal.dim("  … truncated — see columns below"));
  }

  lines.push("");
  return lines;
}

/**
 * @param {InspectorResult} result
 * @param {AnalysisReport} report
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatGraphSection(result, report, pal) {
  if (result.status === "error") {
    return frameSection(
      "graph",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }

  const data = result.data ?? {};
  const left = Array.isArray(data.importedBy) ? data.importedBy : [];
  const right = Array.isArray(data.imports) ? data.imports : [];
  const targetName = basename(report.target);
  const mode = data.pathMode ?? report.options?.pathMode ?? "relative";

  /** @type {string[]} */
  const body = [
    pal.dim(`path-mode ${mode}`),
    ...formatFlowSketch(targetName, left, right, pal),
  ];

  const rows = Math.max(left.length, right.length, 1);
  const leftHead = "imported-by";
  const rightHead = "imports";
  const leftW = Math.max(
    leftHead.length,
    ...left.map((x) => visibleWidth(String(x.display))),
    1,
  );
  const rightW = Math.max(
    rightHead.length,
    ...right.map((x) => visibleWidth(String(x.display))),
    1,
  );

  body.push(
    `${pal.bold(leftHead.padEnd(leftW))}  ${pal.bold(rightHead.padEnd(rightW))}`,
  );
  body.push(
    pal.dim(`${"─".repeat(leftW)}  ${"─".repeat(rightW)}`),
  );

  for (let i = 0; i < rows; i += 1) {
    const l = left[i]?.display ?? "";
    const r = right[i]?.display ?? "";
    const rStyled = right[i]?.isExternal ? pal.yellow(String(r)) : String(r);
    body.push(
      `${String(l).padEnd(leftW)}  ${rStyled}${" ".repeat(Math.max(0, rightW - visibleWidth(String(r))))}`,
    );
  }

  if (Array.isArray(data.details?.skipped) && data.details.skipped.length > 0) {
    body.push("");
    body.push(
      pal.dim(`skipped ${data.details.skipped.length} unreadable candidate(s)`),
    );
  }

  return frameSection("graph", body, pal);
}

/**
 * Текстовый отчёт — schematic layout.
 *
 * @param {AnalysisReport} report
 * @param {{ color?: boolean }} [styleOpts]
 * @returns {string}
 */
export function formatTextReport(report, styleOpts = {}) {
  const color =
    styleOpts.color === undefined ? useColor() : Boolean(styleOpts.color);
  const pal = createPalette(color);
  const opts = report.options ?? {};

  const relTarget = shortPath(report.target, report.cwd);
  /** @type {string[]} */
  const lines = [
    `${pal.bold("dependra")} ${pal.dim(report.version)} ${pal.dim("·")} ${pal.cyan("schematic")}`,
    `${pal.dim("target")}  ${relTarget}`,
    `${pal.dim("cwd")}     ${report.cwd}`,
    "",
  ];

  const basic = report.results["basic-file-information"];
  if (opts.basic && basic) {
    lines.push(...formatBasicSection(basic, report, pal), "");
  }

  const ie = report.results["import-export-analysis"];
  if (ie && (opts.imports || opts.exports)) {
    lines.push(
      ...formatImportExportSections(
        ie,
        Boolean(opts.imports),
        Boolean(opts.exports),
        pal,
      ),
    );
  }

  // When only basic ran above and IE added trailing "", fine.
  // Ensure single blank before graph if needed — trim later.

  const graph = report.results["dependency-analysis"];
  if (opts.graph && graph) {
    lines.push(...formatGraphSection(graph, report, pal), "");
  }

  if (report.prerequisiteErrors?.length) {
    lines.push(
      ...frameSection(
        "prerequisite",
        report.prerequisiteErrors.map((msg) => pal.red(`✖ ${msg}`)),
        pal,
      ),
      "",
    );
  }

  lines.push(...formatBanner(pal));

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

/**
 * @param {AnalysisReport} report
 * @param {{ json?: boolean, color?: boolean }} [opts]
 * @returns {string}
 */
export function formatReport(report, opts = {}) {
  if (opts.json) return formatJsonReport(report);
  return formatTextReport(report, { color: opts.color });
}
