import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, relative } from "node:path";
import { parseJavaScript } from "./acorn-adapter.js";
import { ParserError } from "./errors.js";

const JS_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);

/**
 * @typedef {object} SourceFile
 * @property {string} path
 * @property {string} [relativePath]
 * @property {"javascript"} language
 * @property {"esm"|"cjs"|"unknown"} moduleKind
 * @property {string} [sourceText]
 * @property {object} [ast]
 */

/**
 * @param {string} absPath
 * @returns {boolean}
 */
export function isSupportedJavaScriptPath(absPath) {
  return JS_EXTENSIONS.has(extname(absPath).toLowerCase());
}

/**
 * Читает файл и строит SourceFile с AST (через адаптер Acorn).
 *
 * @param {string} absPath Абсолютный путь
 * @param {string} cwd Для relativePath
 * @returns {Promise<SourceFile>}
 */
export async function loadSourceFile(absPath, cwd) {
  if (!existsSync(absPath)) {
    throw new ParserError(
      "FILE_NOT_FOUND",
      `Файл не найден: ${absPath}`,
      "validation",
      { filePath: absPath },
    );
  }

  let st;
  try {
    st = statSync(absPath);
  } catch (err) {
    throw new ParserError(
      "READ_FAILED",
      `Не удалось прочитать путь: ${absPath}`,
      "execution",
      {
        filePath: absPath,
        cause: err instanceof Error ? err.message : String(err),
      },
    );
  }

  if (!st.isFile()) {
    throw new ParserError(
      "FILE_NOT_FOUND",
      `Не файл: ${absPath}`,
      "validation",
      { filePath: absPath },
    );
  }

  if (!isSupportedJavaScriptPath(absPath)) {
    throw new ParserError(
      "UNSUPPORTED_LANGUAGE",
      `MVP поддерживает только JavaScript (.js/.mjs/.cjs): ${absPath}`,
      "validation",
      { filePath: absPath, ext: extname(absPath) },
    );
  }

  let sourceText;
  try {
    sourceText = await readFile(absPath, "utf8");
  } catch (err) {
    throw new ParserError(
      "READ_FAILED",
      `Не удалось прочитать файл: ${absPath}`,
      "execution",
      {
        filePath: absPath,
        cause: err instanceof Error ? err.message : String(err),
      },
    );
  }

  const ast = parseJavaScript(sourceText, { filePath: absPath });
  const rel = relative(cwd, absPath);

  /** @type {SourceFile} */
  const sourceFile = {
    path: absPath,
    relativePath: rel.startsWith("..") ? absPath : rel,
    language: "javascript",
    moduleKind: "unknown",
    sourceText,
    ast,
  };

  return sourceFile;
}

/**
 * Гарантирует SourceFile целевого файла в `ctx.projectModel.files`.
 * Повторно не читает/не парсит, если AST уже есть.
 *
 * @param {import('../core/types.js').AnalysisContext} ctx
 * @returns {Promise<SourceFile>}
 */
export async function ensureTargetSourceFile(ctx) {
  const existing = ctx.projectModel.files[ctx.targetPath];
  if (existing?.ast && existing.sourceText != null) {
    return /** @type {SourceFile} */ (existing);
  }

  const sourceFile = await loadSourceFile(ctx.targetPath, ctx.cwd);
  ctx.projectModel.files[sourceFile.path] = sourceFile;
  return sourceFile;
}
