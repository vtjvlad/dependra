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
 * @param {InspectorResult} result
 * @param {AnalysisReport} report
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatMermaidSection(result, report, pal) {
  if (result.status === "error") {
    return frameSection(
      "mermaid",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const m = result.data?.formats?.mermaid ?? {};
  /** @type {string[]} */
  const body = [];
  for (const [name, text] of Object.entries(m)) {
    body.push(pal.dim(`· ${name}`));
    for (const line of String(text).trimEnd().split("\n")) {
      body.push(line);
    }
    body.push("");
  }
  if (body.length === 0) body.push(pal.dim("(empty)"));
  return frameSection("mermaid", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatGraphvizSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "graphviz",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const g = result.data?.formats?.graphviz ?? {};
  /** @type {string[]} */
  const body = [];
  for (const [name, text] of Object.entries(g)) {
    body.push(pal.dim(`· ${name}`));
    for (const line of String(text).trimEnd().split("\n")) {
      body.push(line);
    }
    body.push("");
  }
  if (body.length === 0) body.push(pal.dim("(empty)"));
  return frameSection("graphviz", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatVizJsonSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "viz-json",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const j = result.data?.formats?.json ?? {};
  /** @type {string[]} */
  const body = [];
  for (const [name, view] of Object.entries(j)) {
    const nodes = view?.nodes?.length ?? 0;
    const edges = view?.edges?.length ?? 0;
    body.push(`${pal.cyan(name)}  nodes ${nodes} · edges ${edges}`);
  }
  if (body.length === 0) body.push(pal.dim("(empty)"));
  return frameSection("viz-json", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatMetadataSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "metadata",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const providers = result.data?.providers ?? [];
  const skipped = result.data?.skippedProviders ?? [];
  /** @type {string[]} */
  const body = [];
  for (const p of providers) {
    if (p.id === "fs-extended") {
      const d = p.data ?? {};
      body.push(
        `${pal.cyan("fs-extended")}  ino ${d.ino ?? "—"} · mtime ${d.mtimeMs ?? "—"}`,
      );
    } else if (p.id === "embedded-text") {
      const markers = p.data?.markers ?? [];
      const summary = markers
        .map((m) => `${m.kind} ${m.value}`)
        .join(" · ");
      body.push(
        `${pal.cyan("embedded-text")}  ${summary || pal.dim("(no markers)")}`,
      );
    } else {
      body.push(`${pal.cyan(p.id)}  ok`);
    }
  }
  for (const s of skipped) {
    body.push(pal.dim(`skipped  ${s.id} (${s.reason})`));
  }
  if (body.length === 0) body.push(pal.dim("(none)"));
  return frameSection("metadata", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatQualitySection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "quality",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const d = result.data ?? {};
  const scores = d.scores ?? {};
  const metrics = d.metrics ?? {};
  const findings = Array.isArray(d.findings) ? d.findings : [];
  const summary = d.summary ?? {};

  /** @type {string[]} */
  const body = [
    `${pal.dim("scores")}   quality ${scores.quality ?? "—"} · style ${scores.style ?? "—"}  ${pal.dim(scores.method ?? "")}`,
    `${pal.dim("metrics")}  code ${metrics.linesCode ?? 0} · comment ${metrics.linesComment ?? 0} · blank ${metrics.linesBlank ?? 0} · excess ${metrics.linesExcessBlank ?? 0}`,
    `${pal.dim("locals")}   unused ${metrics.localsUnused ?? 0}/${metrics.localsDeclared ?? 0} · dup ${metrics.duplicateBlocks ?? 0}`,
    `${pal.dim("summary")}  error ${summary.error ?? 0} · warning ${summary.warning ?? 0} · info ${summary.info ?? 0}`,
  ];

  if (findings.length === 0) {
    body.push("", pal.dim("∅  none"));
  } else {
    body.push("");
    for (const f of findings) {
      const sev =
        f.severity === "error"
          ? pal.red("error")
          : f.severity === "warning"
            ? pal.yellow("warning")
            : pal.dim("info");
      const loc =
        f.loc != null ? pal.dim(`:${f.loc.line}:${f.loc.column}`) : "";
      const name = f.name ? ` ${f.name}` : "";
      body.push(`${sev}  ${f.code}${name}${loc}  ${f.message ?? ""}`);
    }
  }

  return frameSection("quality", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatAiExplainSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "ai-explain",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const d = result.data ?? {};
  /** @type {string[]} */
  const body = [
    `${pal.dim("provider")}  ${d.provider ?? "—"}  ${pal.dim(d.model ?? "")}`,
  ];

  if (d.skipped) {
    body.push(pal.yellow(`skipped  ${d.skipReason ?? "unknown"}`));
  } else {
    const explanations = Array.isArray(d.explanations) ? d.explanations : [];
    if (explanations.length === 0) {
      body.push(pal.dim("∅  none"));
    } else {
      for (const ex of explanations) {
        const ref = ex.refCode ? `${ex.refCode} · ` : "";
        body.push(`${pal.cyan("→")}  ${ref}${ex.summary ?? ""}`);
        if (ex.detail) body.push(pal.dim(`     ${ex.detail}`));
      }
    }
  }

  return frameSection("ai-explain", body, pal);
}

/**
 * @param {InspectorResult} result
 * @param {Palette} pal
 * @returns {string[]}
 */
function formatModificationSection(result, pal) {
  if (result.status === "error") {
    return frameSection(
      "modification",
      [pal.red(`✖ ${result.error?.code}: ${result.error?.message}`)],
      pal,
    );
  }
  const d = result.data ?? {};
  /** @type {string[]} */
  const body = [
    `${pal.dim("mode")}     ${d.mode ?? "—"}`,
    `${pal.dim("summary")}  proposed ${d.summary?.proposed ?? 0} · applied ${d.summary?.applied ?? 0} · failed ${d.summary?.failed ?? 0}`,
  ];
  if (d.backup?.sessionId) {
    body.push(
      `${pal.dim("backup")}   ${d.backup.sessionId}  ${pal.dim(d.backup.dir ?? "")}`,
    );
  }
  const changes = Array.isArray(d.changes) ? d.changes : [];
  if (changes.length === 0) {
    body.push(pal.dim("∅  no changes"));
  } else {
    body.push("");
    for (const c of changes.slice(0, 40)) {
      const mark = c.skippedReason
        ? pal.yellow("·")
        : c.selected === false
          ? pal.dim("·")
          : pal.cyan("→");
      const risk =
        c.risk === "dangerous"
          ? pal.red("dangerous")
          : c.risk === "caution"
            ? pal.yellow("caution")
            : pal.dim("safe");
      body.push(
        `${mark}  ${pal.bold(c.id)}  ${c.op}  ${risk}  ${c.summary ?? ""}`,
      );
      if (c.skippedReason) {
        body.push(pal.dim(`     skip: ${c.skippedReason}`));
      }
    }
    if (changes.length > 40) {
      body.push(pal.dim(`… +${changes.length - 40} more`));
    }
  }
  return frameSection("modification", body, pal);
}

/**
 * Resolve color from report config.
 * @param {{ color?: boolean }} styleOpts
 * @param {object|null|undefined} reportCfg
 * @returns {boolean}
 */
function resolveColor(styleOpts, reportCfg) {
  if (styleOpts.color !== undefined) return Boolean(styleOpts.color);
  const mode = reportCfg?.color ?? "auto";
  if (mode === "always") return true;
  if (mode === "never") return false;
  return useColor();
}

/**
 * Текстовый отчёт — schematic layout.
 *
 * @param {AnalysisReport} report
 * @param {{ color?: boolean, report?: object|null }} [styleOpts]
 * @returns {string}
 */
export function formatTextReport(report, styleOpts = {}) {
  const reportCfg = styleOpts.report ?? null;
  const color = resolveColor(styleOpts, reportCfg);
  const pal = createPalette(color);
  const opts = report.options ?? {};
  const hide = new Set(reportCfg?.hideSections ?? []);
  const style = reportCfg?.style ?? "schematic";
  const showBanner = reportCfg?.banner !== false;
  const unicode = reportCfg?.unicode !== false;

  const styleLabel = style === "plain" ? "plain" : "schematic";
  const relTarget = shortPath(report.target, report.cwd);
  /** @type {string[]} */
  const lines = [
    `${pal.bold("dependra")} ${pal.dim(report.version)} ${pal.dim("·")} ${pal.cyan(styleLabel)}`,
    `${pal.dim("target")}  ${relTarget}`,
    `${pal.dim("cwd")}     ${report.cwd}`,
    "",
  ];

  /** @type {{ id: string, lines: string[] }[]} */
  const sections = [];

  const push = (id, sectionLines) => {
    if (hide.has(id)) return;
    if (!sectionLines?.length) return;
    sections.push({ id, lines: sectionLines });
  };

  const frame =
    style === "plain" || !unicode
      ? (title, body) => {
          const out = [`[${title}]`, ...body.map((l) => `  ${l}`), ""];
          return out;
        }
      : (title, body) => frameSection(title, body, pal);

  // Re-wrap existing formatters: they return framed lines. For plain we rebuild briefly via hide/order only.
  const basic = report.results["basic-file-information"];
  if (opts.basic && basic) {
    push("file", formatBasicSection(basic, report, pal));
  }

  const ie = report.results["import-export-analysis"];
  if (ie && (opts.imports || opts.exports)) {
    const blocks = formatImportExportSections(
      ie,
      Boolean(opts.imports),
      Boolean(opts.exports),
      pal,
    );
    // formatImportExportSections returns combined framed blocks; keep as imports/exports logical
    if (opts.imports) push("imports", blocks);
    else push("exports", blocks);
  }

  const graph = report.results["dependency-analysis"];
  if (opts.graph && graph) {
    push("graph", formatGraphSection(graph, report, pal));
  }

  const additional = report.results["additional-file-information"];
  if (opts.additional && additional) {
    push("additional", formatAdditionalSection(additional, pal));
  }

  const entities = report.results["exported-entities"];
  if (opts.entities && entities) {
    push("entities", formatEntitiesSection(entities, pal));
  }

  const validation = report.results.validation;
  if (opts.validate && validation) {
    push("diagnostics", formatDiagnosticsSection(validation, pal));
  }

  const environment = report.results["file-environment-analysis"];
  if (opts.environment && environment) {
    push("environment", formatEnvironmentSection(environment, pal));
  }

  const commands = report.results.commands;
  if (opts.commands && commands) {
    push("commands", formatCommandsSection(commands, pal));
  }

  const envCheck = report.results["environment-validation"];
  if (opts.envCheck && envCheck) {
    push("env-check", formatEnvCheckSection(envCheck, pal));
  }

  const runtime = report.results["runtime-dependency-analysis"];
  if (opts.runtime && runtime) {
    push("runtime", formatRuntimeSection(runtime, pal));
  }

  const io = report.results["file-operations"];
  if (opts.io && io) {
    push("io", formatIoSection(io, pal));
  }

  const visualization = report.results.visualization;
  if (visualization) {
    if (opts.mermaid) {
      push("mermaid", formatMermaidSection(visualization, report, pal));
    }
    if (opts.graphviz) {
      push("graphviz", formatGraphvizSection(visualization, pal));
    }
    if (opts.vizJson) {
      push("viz-json", formatVizJsonSection(visualization, pal));
    }
  }

  const metadata = report.results.metadata;
  if (opts.metadata && metadata) {
    push("metadata", formatMetadataSection(metadata, pal));
  }

  const quality = report.results["code-quality-analysis"];
  if (opts.quality && quality) {
    push("quality", formatQualitySection(quality, pal));
  }

  const aiExplain = report.results["ai-explain"];
  if (opts.explain && aiExplain) {
    push("ai-explain", formatAiExplainSection(aiExplain, pal));
  }

  const modification = report.results.modification;
  const wantMod =
    opts.format ||
    opts.sortImports ||
    opts.fixImports ||
    opts.fixExports ||
    opts.stripComments ||
    opts.commentBanner ||
    opts.installDeps ||
    opts.aiModify ||
    opts.undo ||
    opts.apply ||
    opts.dryRun;
  if (wantMod && modification) {
    push("modification", formatModificationSection(modification, pal));
  }

  if (report.prerequisiteErrors?.length) {
    push(
      "prerequisite",
      frameSection(
        "prerequisite",
        report.prerequisiteErrors.map((msg) => pal.red(`✖ ${msg}`)),
        pal,
      ),
    );
  }

  const order = Array.isArray(reportCfg?.sectionOrder)
    ? reportCfg.sectionOrder
    : null;
  /** @type {{ id: string, lines: string[] }[]} */
  let ordered = sections;
  if (order) {
    const map = new Map(sections.map((s) => [s.id, s]));
    ordered = [];
    for (const id of order) {
      const s = map.get(id);
      if (s) {
        ordered.push(s);
        map.delete(id);
      }
    }
    for (const s of map.values()) ordered.push(s);
  }

  for (const s of ordered) {
    if (style === "plain" || !unicode) {
      // strip box and emit plain — keep content lines heuristically
      const content = s.lines
        .filter((l) => !/^[┌└│]/.test(l.replace(/\u001b\[[0-9;]*m/g, "").trimStart() === "" ? "x" : l.replace(/\u001b\[[0-9;]*m/g, "")))
        .filter((l) => {
          const t = l.replace(/\u001b\[[0-9;]*m/g, "");
          return !t.startsWith("┌") && !t.startsWith("└") && !t.startsWith("│");
        });
      // Simpler: just use framed output even for plain if strip is fragile — use id header
      lines.push(`[${s.id}]`);
      for (const l of s.lines) {
        const t = l.replace(/\u001b\[[0-9;]*m/g, "");
        if (t.startsWith("┌") || t.startsWith("└")) continue;
        if (t.startsWith("│")) {
          lines.push(t.slice(1).replace(/\s+│\s*$/, "").trimEnd());
        } else {
          lines.push(l);
        }
      }
      lines.push("");
    } else {
      lines.push(...s.lines, "");
    }
  }

  if (showBanner) {
    lines.push(...formatBanner(pal));
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

/**
 * @param {AnalysisReport} report
 * @param {{ json?: boolean, color?: boolean, report?: object|null }} [opts]
 * @returns {string}
 */
export function formatReport(report, opts = {}) {
  if (opts.json) return formatJsonReport(report);
  return formatTextReport(report, {
    color: opts.color,
    report: opts.report,
  });
}
