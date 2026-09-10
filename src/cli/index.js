#!/usr/bin/env node

import { existsSync, statSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { createAnalysisContext, runPipeline } from "../core/index.js";
import { registerBuiltInInspectors } from "../inspectors/index.js";
import { runUndo } from "../modifications/index.js";
import { findProjectRoot } from "../inspectors/scan-js-files.js";
import { formatReport } from "../reporters/index.js";
import { PACKAGE_VERSION, formatCliVersion } from "../version.js";
import { formatHelp } from "./help.js";
import { resolveCli } from "./resolve-cli.js";

registerBuiltInInspectors();

/**
 * @returns {Promise<number>}
 */
async function main() {
  const parsed = resolveCli(process.argv.slice(2));

  if (parsed.warnings?.length) {
    for (const w of parsed.warnings) {
      process.stderr.write(`warning: ${w}\n`);
    }
  }

  if (parsed.error) {
    process.stderr.write(`${parsed.error}\n`);
    return 1;
  }

  if (parsed.help) {
    process.stdout.write(formatHelp());
    return 0;
  }

  if (parsed.version) {
    process.stdout.write(`${formatCliVersion()}\n`);
    return 0;
  }

  const cwd = process.cwd();

  // Undo without requiring a target file
  if (parsed.options.undo && !parsed.targetPath) {
    const root = findProjectRoot(cwd, cwd);
    const undone = runUndo(root, parsed.options.undoSession ?? null);
    if (!undone.ok) {
      process.stderr.write(`${undone.message}\n`);
      return 1;
    }
    const report = {
      version: PACKAGE_VERSION,
      target: root,
      cwd,
      options: { undo: true, json: parsed.options.json },
      results: {
        modification: {
          inspectorId: "modification",
          status: "ok",
          data: undone.report,
        },
      },
    };
    process.stdout.write(
      formatReport(report, {
        json: parsed.options.json,
        report: parsed.options.report,
      }),
    );
    return undone.report.summary.failed > 0 ? 1 : 0;
  }

  if (!parsed.targetPath) {
    process.stderr.write("Укажите путь к файлу. См. --help\n");
    process.stdout.write(formatHelp());
    return 1;
  }

  const targetPath = isAbsolute(parsed.targetPath)
    ? parsed.targetPath
    : resolve(cwd, parsed.targetPath);

  if (!existsSync(targetPath)) {
    process.stderr.write(`Файл не найден: ${targetPath}\n`);
    return 1;
  }

  let st;
  try {
    st = statSync(targetPath);
  } catch {
    process.stderr.write(`Не удалось прочитать путь: ${targetPath}\n`);
    return 1;
  }

  if (!st.isFile()) {
    process.stderr.write(`Не файл: ${targetPath}\n`);
    return 1;
  }

  try {
    const ctx = createAnalysisContext(targetPath, cwd, parsed.options);
    const { report, exitCode, prerequisiteErrors } = await runPipeline(ctx);

    for (const msg of prerequisiteErrors) {
      process.stderr.write(`${msg}\n`);
    }

    process.stdout.write(
      formatReport(report, {
        json: parsed.options.json,
        report: parsed.options.report,
      }),
    );
    return exitCode;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Внутренняя ошибка: ${message}\n`);
    return 3;
  }
}

const code = await main();
process.exit(code);
