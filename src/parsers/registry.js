/**
 * Реестр language backends (S09).
 * @see docs/20-architecture/language-backend.md
 */

import { extname } from "node:path";
import { javascriptBackend } from "./javascript-backend.js";
import { typescriptBackend } from "./typescript-backend.js";

/**
 * @typedef {"javascript"|"typescript"|string} LanguageId
 */

/**
 * @typedef {object} LanguageBackendMeta
 * @property {LanguageId} id
 * @property {string} version
 * @property {string[]} extensions
 * @property {string[]} [aliases]
 */

/**
 * @typedef {object} LoadParseOptions
 * @property {string} cwd
 * @property {boolean} [wantAst=true]
 * @property {boolean} [wantSourceText=true]
 */

/**
 * @typedef {object} TreeSitterProvider
 * @property {() => boolean} isAvailable
 * @property {(sourceText: string, languageId: LanguageId) => Promise<object|null>} parse
 */

/**
 * @typedef {object} LspProvider
 * @property {() => boolean} isAvailable
 * @property {(absPath: string, sourceText: string) => Promise<object|null>} query
 */

/**
 * @typedef {object} LanguageBackend
 * @property {LanguageBackendMeta} meta
 * @property {(absPath: string) => boolean} supportsPath
 * @property {(absPath: string, opts: LoadParseOptions) => Promise<import("./load-source-file.js").SourceFile>} loadSourceFile
 * @property {{ treeSitter?: TreeSitterProvider, lsp?: LspProvider }} [providers]
 */

/** @type {Map<string, LanguageBackend>} */
const backendsById = new Map();

/** @type {Map<string, LanguageBackend>} */
const backendsByExt = new Map();

let builtinsRegistered = false;

/**
 * @param {LanguageBackend} backend
 */
export function registerBackend(backend) {
  backendsById.set(backend.meta.id, backend);
  for (const ext of backend.meta.extensions) {
    backendsByExt.set(ext.toLowerCase(), backend);
  }
  if (Array.isArray(backend.meta.aliases)) {
    for (const alias of backend.meta.aliases) {
      backendsById.set(alias, backend);
    }
  }
}

/**
 * @param {string} absPath
 * @returns {LanguageBackend|undefined}
 */
export function getBackendForPath(absPath) {
  const ext = extname(absPath).toLowerCase();
  const byExt = backendsByExt.get(ext);
  if (byExt) return byExt;
  for (const backend of backendsById.values()) {
    if (backend.supportsPath(absPath)) return backend;
  }
  return undefined;
}

/**
 * @param {LanguageId} id
 * @returns {LanguageBackend|undefined}
 */
export function getBackendById(id) {
  return backendsById.get(id);
}

/**
 * Все зарегистрированные расширения (lower-case с точкой), уникальные, стабильный порядок.
 * @returns {string[]}
 */
export function listExtensions() {
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const backend of new Set(backendsById.values())) {
    for (const ext of backend.meta.extensions) {
      const e = ext.toLowerCase();
      if (seen.has(e)) continue;
      seen.add(e);
      out.push(e);
    }
  }
  return out;
}

/**
 * @returns {LanguageBackend[]}
 */
export function listBackends() {
  return [...new Set(backendsById.values())];
}

/**
 * Register built-in JS + TS backends (idempotent).
 */
export function registerBuiltInBackends() {
  if (builtinsRegistered) return;
  registerBackend(javascriptBackend);
  registerBackend(typescriptBackend);
  builtinsRegistered = true;
}

/**
 * Ensure builtins exist (safe for early callers before api.registerBuiltins).
 */
export function ensureBuiltInBackends() {
  registerBuiltInBackends();
}
