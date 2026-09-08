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
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatAdditionalSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "additional",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const d = result.data ?? {};
  const perms = d.permissions ?? {};
  const hints = d.privilegeHints ?? {};
  /** @type {string[]} */
  const body = [
    `${pal.dim("abs")}    ${d.absolutePath ?? "—"}`,
    `${pal.dim("rel")}    ${d.relativePath ?? "—"}`,
    `${pal.dim("mode")}   ${perms.modeString ?? "—"}  ·  ${perms.modeOctal ?? ""}  ·  uid ${perms.uid ?? "—"}`,
    `${pal.dim("priv")}   read ${hints.read ?? "?"} · write ${hints.write ?? "?"} · chmod ${hints.chmod ?? "?"} · delete ${hints.delete ?? "?"}`,
    `${pal.dim("copies")}`,
  ];
  const copies = Array.isArray(d.copies) ? d.copies : [];
  if (copies.length === 0) {
    body.push(pal.dim("  ∅  none"));
  } else {
    for (const c of copies) {
      body.push(
        `${pal.cyan("→")}  ${c.display}${padTo(String(c.display), 28)}${pal.dim(`score ${c.score}`)}`,
      );
    }
  }
  if (d.details?.scanWarning) {
    body.push("");
    body.push(pal.yellow(`warning: ${d.details.scanWarning}`));
  }
  return frameSection("additional", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatEntitiesSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "entities",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const d = result.data ?? {};
  /** @type {string[]} */
  const body = [pal.dim(`path-mode ${d.pathMode ?? "relative"}`)];
  const exported = Array.isArray(d.exported) ? d.exported : [];
  const imported = Array.isArray(d.imported) ? d.imported : [];

  if (exported.length === 0) {
    body.push(pal.dim("export  ∅  none"));
  } else {
    for (const exp of exported) {
      body.push(
        `export  ${pal.green("◆")}  ${exp.display ?? exp.name}${padTo(String(exp.display ?? exp.name), 20)}${pal.dim(String(exp.kind))}`,
      );
    }
  }
  if (imported.length === 0) {
    body.push(pal.dim("import  ∅  none"));
  } else {
    for (const imp of imported) {
      const from = imp.from ? pal.dim(`  ← ${imp.from}`) : "";
      body.push(
        `import  ${pal.cyan("→")}  ${imp.name ?? "*"}${from}${padTo(`${imp.name ?? "*"}${imp.from ? `  ← ${imp.from}` : ""}`, 22)}${pal.dim(String(imp.kind))}`,
      );
      if (imp.display && imp.display !== imp.name && d.pathMode !== "name") {
        body.push(pal.dim(`             ${imp.display}`));
      }
    }
  }
  return frameSection("entities", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatDiagnosticsSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "diagnostics",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const d = result.data ?? {};
  const summary = d.summary ?? { error: 0, warning: 0, info: 0 };
  /** @type {string[]} */
  const body = [
    pal.dim(`path-mode ${d.pathMode ?? "relative"}`),
    `${pal.red(`${summary.error ?? 0} error`)} · ${pal.yellow(`${summary.warning ?? 0} warnings`)}`,
  ];
  const list = Array.isArray(d.diagnostics) ? d.diagnostics : [];
  if (list.length === 0) {
    body.push(pal.dim("∅  none"));
  } else {
    for (const item of list) {
      const mark =
        item.severity === "error"
          ? pal.red("✖")
          : item.severity === "warning"
            ? pal.yellow("⚠")
            : pal.dim("·");
      let ctx = "";
      if (item.code === "CYCLE" && Array.isArray(item.paths)) {
        ctx = item.paths.join(" → ");
      } else if (item.display) {
        ctx = String(item.display);
      } else if (item.source) {
        ctx = String(item.source);
      } else if (item.name) {
        ctx = String(item.name);
      }
      const loc =
        item.loc != null
          ? pal.dim(`  :${item.loc.line}:${item.loc.column}`)
          : "";
      body.push(
        `${mark} ${String(item.code).padEnd(14)} ${ctx}${loc}`,
      );
    }
  }
  if (Array.isArray(d.skipped) && d.skipped.length > 0) {
    body.push("");
    body.push(pal.dim(`skipped ${d.skipped.length} unreadable candidate(s)`));
  }
  return frameSection("diagnostics", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatEnvironmentSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "environment",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const d = result.data ?? {};
  const syn = d.symlink ?? {};
  const hl = d.hardLink ?? {};
  /** @type {string[]} */
  const body = [
    `${pal.dim("symlink")}  ${syn.isSymlink ? pal.yellow("yes") : "no"}${syn.target ? ` → ${syn.target}` : ""}`,
    `${pal.dim("nlink")}    ${hl.nlink ?? "—"}  ·  inode ${hl.inode ?? "—"}`,
    `${pal.dim("scripts")}`,
  ];
  const scripts = Array.isArray(d.scripts) ? d.scripts : [];
  if (scripts.length === 0) body.push(pal.dim("  ∅  none"));
  else {
    for (const s of scripts) {
      body.push(`${pal.cyan("→")}  ${s.display}  ${pal.dim(s.kind)}`);
    }
  }
  body.push(pal.dim("entry"));
  const entries = Array.isArray(d.entryPoints) ? d.entryPoints : [];
  if (entries.length === 0) body.push(pal.dim("  ∅  none"));
  else {
    for (const e of entries) {
      body.push(`${pal.green("◆")}  ${e.display}  ${pal.dim(e.kind)}`);
    }
  }
  return frameSection("environment", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatCommandsSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "commands",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const list = Array.isArray(result.data?.commands) ? result.data.commands : [];
  /** @type {string[]} */
  const body = [];
  if (list.length === 0) body.push(pal.dim("∅  none"));
  else {
    const parts = list.map((c) =>
      c.available ? `${c.name} ${pal.green("✓")}` : `${c.name} ${pal.dim("✗")}`,
    );
    // wrap roughly
    let line = "";
    for (const p of parts) {
      const next = line ? `${line} · ${p}` : p;
      if (visibleWidth(next) > 70 && line) {
        body.push(line);
        line = p;
      } else {
        line = next;
      }
    }
    if (line) body.push(line);
  }
  return frameSection("commands", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatEnvCheckSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "env-check",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const tools = Array.isArray(result.data?.tools) ? result.data.tools : [];
  const missing = Array.isArray(result.data?.missing) ? result.data.missing : [];
  /** @type {string[]} */
  const body = [];
  for (const t of tools) {
    const mark = t.available ? pal.green("✓") : pal.red("✗");
    const ver = t.version ? pal.dim(` ${t.version}`) : "";
    const req = t.required ? "" : pal.dim(" (optional)");
    body.push(`${mark}  ${t.name}${ver}${req}`);
  }
  if (missing.length > 0) {
    body.push("");
    body.push(pal.yellow(`missing: ${missing.join(", ")}`));
  }
  if (body.length === 0) body.push(pal.dim("∅  none"));
  return frameSection("env-check", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatRuntimeSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "runtime",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const d = result.data ?? {};
  const rt = d.runtime;
  /** @type {string[]} */
  const body = [`${pal.dim("language")}  ${d.language ?? "unknown"}`];
  if (!rt) {
    body.push(pal.dim("runtime   ∅"));
  } else {
    const avail = rt.available ? pal.green("✓") : pal.red("✗");
    body.push(
      `${pal.dim("runtime")}   ${rt.kind} ${pal.bold(rt.name)} ${avail}`,
    );
    if (rt.version) body.push(`${pal.dim("version")}   ${rt.version}`);
    if (rt.commandHint) {
      body.push(`${pal.dim("hint")}      ${pal.cyan(rt.commandHint)}`);
    }
    if (rt.shebang) body.push(`${pal.dim("shebang")}   ${rt.shebang}`);
  }
  return frameSection("runtime", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatIoSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "io",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const d = result.data ?? {};
  const ops = Array.isArray(d.operations) ? d.operations : [];
  const sum = d.summary ?? {};
  /** @type {string[]} */
  const body = [
    pal.dim(
      `read ${sum.read ?? 0} · write ${sum.write ?? 0} · create ${sum.create ?? 0} · delete ${sum.delete ?? 0} · change ${sum.change ?? 0}`,
    ),
  ];
  if (ops.length === 0) body.push(pal.dim("∅  none"));
  else {
    for (const op of ops) {
      const path = op.display ?? op.pathLiteral ?? pal.dim("(dynamic)");
      const loc =
        op.loc != null ? pal.dim(`  :${op.loc.line}:${op.loc.column}`) : "";
      body.push(
        `${String(op.kind).padEnd(7)} ${pal.cyan(op.api)}${padTo(String(op.api), 18)}${path}${loc}`,
      );
    }
  }
  return frameSection("io", body, pal);
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

  const graph = report.results["dependency-analysis"];
  if (opts.graph && graph) {
    lines.push(...formatGraphSection(graph, report, pal), "");
  }

  const additional = report.results["additional-file-information"];
  if (opts.additional && additional) {
    lines.push(...formatAdditionalSection(additional, pal), "");
  }

  const entities = report.results["exported-entities"];
  if (opts.entities && entities) {
    lines.push(...formatEntitiesSection(entities, pal), "");
  }

  const validation = report.results.validation;
  if (opts.validate && validation) {
    lines.push(...formatDiagnosticsSection(validation, pal), "");
  }

  const environment = report.results["file-environment-analysis"];
  if (opts.environment && environment) {
    lines.push(...formatEnvironmentSection(environment, pal), "");
  }

  const commands = report.results.commands;
  if (opts.commands && commands) {
    lines.push(...formatCommandsSection(commands, pal), "");
  }

  const envCheck = report.results["environment-validation"];
  if (opts.envCheck && envCheck) {
    lines.push(...formatEnvCheckSection(envCheck, pal), "");
  }

  const runtime = report.results["runtime-dependency-analysis"];
  if (opts.runtime && runtime) {
    lines.push(...formatRuntimeSection(runtime, pal), "");
  }

  const io = report.results["file-operations"];
  if (opts.io && io) {
    lines.push(...formatIoSection(io, pal), "");
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
