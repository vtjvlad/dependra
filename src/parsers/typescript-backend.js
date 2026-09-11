import { extname, relative } from "node:path";
import { parseTypeScript } from "./typescript-estree-adapter.js";
import { PACKAGE_VERSION } from "../version.js";
import { assertReadableFile, readUtf8File } from "./file-io.js";
import { nullTreeSitterProvider } from "./providers/tree-sitter.js";
import { nullLspProvider } from "./providers/lsp.js";

const EXTENSIONS = [".ts", ".tsx"];

/**
 * @typedef {import('./registry.js').LanguageBackend} LanguageBackend
 * @typedef {import('./load-source-file.js').SourceFile} SourceFile
 */

/**
 * @param {string} absPath
 * @param {import('./registry.js').LoadParseOptions} opts
 * @returns {Promise<SourceFile>}
 */
async function loadTypeScriptSourceFile(absPath, opts) {
  assertReadableFile(absPath);
  const wantText = opts.wantSourceText !== false;
  const wantAst = opts.wantAst !== false;
  const sourceText = wantText || wantAst ? await readUtf8File(absPath) : undefined;
  const rel = relative(opts.cwd, absPath);
  /** @type {SourceFile} */
  const sourceFile = {
    path: absPath,
    relativePath: rel.startsWith("..") ? absPath : rel,
    language: "typescript",
    moduleKind: "unknown",
  };
  if (wantText && sourceText != null) sourceFile.sourceText = sourceText;
  if (wantAst && sourceText != null) {
    const jsx = extname(absPath).toLowerCase() === ".tsx";
    sourceFile.ast = parseTypeScript(sourceText, { filePath: absPath, jsx });
  }
  return sourceFile;
}

/** @type {LanguageBackend} */
export const typescriptBackend = {
  meta: {
    id: "typescript",
    version: PACKAGE_VERSION,
    extensions: [...EXTENSIONS],
  },
  supportsPath(absPath) {
    return EXTENSIONS.includes(extname(absPath).toLowerCase());
  },
  loadSourceFile: loadTypeScriptSourceFile,
  providers: {
    treeSitter: nullTreeSitterProvider,
    lsp: nullLspProvider,
  },
};
