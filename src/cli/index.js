#!/usr/bin/env node

import { existsSync, statSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { createAnalysisContext, runPipeline } from "../core/index.js";
import { parseArgs } from "./parse-args.js";

const PACKAGE_VERSION = "0.0.1";

const HELP = `dependra <file> [options]

Минимальный CLI анализа одного JS-файла (MVP 0.0.1).

Options:
  --basic              Базовая информация о файле
  --imports            Импорты
  --exports            Экспорты
  --graph              Граф зависимостей
  --json               Вывод JSON
  --path-mode <mode>   name|relative|absolute (default: relative)
  --help               Справка
  --version            Версия пакета

Если ни один из --basic|--imports|--exports|--graph не указан,
выполняются все четыре операции.

Entrypoint:
  node src/cli/index.js <file> [options]
`;

/**
 * @param {import('../core/types.js').AnalysisReport} report
 * @param {boolean} asJson
 */
function printReport(report, asJson) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  const lines = [
    `dependra ${report.version}`,
    `target: ${report.target}`,
    `cwd: ${report.cwd}`,
    "",
  ];

  const ids = Object.keys(report.results);
  if (ids.length === 0) {
    lines.push("(нет секций результатов)");
  } else {
    for (const id of ids) {
      const r = report.results[id];
      lines.push(`[${id}] ${r.status}`);
      if (r.status === "error" && r.error) {
        lines.push(`  ${r.error.code}: ${r.error.message}`);
      }
    }
  }

  if (report.prerequisiteErrors?.length) {
    lines.push("", "prerequisite errors:");
    for (const msg of report.prerequisiteErrors) {
      lines.push(`  ${msg}`);
    }
  }

  process.stdout.write(`${lines.join("\n")}\n`);
}

/**
 * @returns {Promise<number>}
 */
async function main() {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.error) {
    process.stderr.write(`${parsed.error}\n`);
    return 1;
  }

  if (parsed.help) {
    process.stdout.write(HELP);
    return 0;
  }

  if (parsed.version) {
    process.stdout.write(`${PACKAGE_VERSION}\n`);
    return 0;
  }

  if (!parsed.targetPath) {
    process.stderr.write("Укажите путь к файлу. См. --help\n");
    process.stdout.write(HELP);
    return 1;
  }

  const cwd = process.cwd();
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

    printReport(report, parsed.options.json);
    return exitCode;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Внутренняя ошибка: ${message}\n`);
    return 3;
  }
}

const code = await main();
process.exit(code);
