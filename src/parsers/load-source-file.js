import { extname } from "node:path";
import { ParserError } from "./errors.js";
import {
  ensureBuiltInBackends,
  getBackendForPath,
  listExtensions,
} from "./registry.js";

/**
 * @typedef {object} SourceFile
 * @property {string} path
 * @property {string} [relativePath]
 * @property {import('./registry.js').LanguageId} language
 * @property {"esm"|"cjs"|"unknown"} moduleKind
 * @property {string} [sourceText]
 * @property {object} [ast]
 */

const JS_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".jsx"]);

/**
 * @param {string} absPath
 * @returns {boolean}
 */
export function isSupportedJavaScriptPath(absPath) {
  return JS_EXTENSIONS.has(extname(absPath).toLowerCase());
}

/**
 * Любой зарегистрированный language-backend.
 * @param {string} absPath
 * @returns {boolean}
 */
export function isSupportedPath(absPath) {
  ensureBuiltInBackends();
  return getBackendForPath(absPath) != null;
}

/**
 * Читает файл и строит SourceFile с AST через language-backend.
 *
 * @param {string} absPath Абсолютный путь
 * @param {string} cwd Для relativePath
 * @returns {Promise<SourceFile>}
 */
export async function loadSourceFile(absPath, cwd) {
  ensureBuiltInBackends();
  const backend = getBackendForPath(absPath);
  if (!backend) {
    const exts = listExtensions().join("/");
    throw new ParserError(
      "UNSUPPORTED_LANGUAGE",
      `Неподдерживаемый язык или расширение (ожидаются ${exts || ".js/.mjs/.cjs/.ts/.tsx"}): ${absPath}`,
      "validation",
      { filePath: absPath, ext: extname(absPath) },
    );
  }
  return backend.loadSourceFile(absPath, { cwd, wantAst: true, wantSourceText: true });
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
