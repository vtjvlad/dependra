/**
 * Публичный API parsers. Инспекторы и core используют только этот модуль,
 * не `acorn` / typescript-estree напрямую (ADR-0001, ADR-0003).
 */
export { ParserError } from "./errors.js";
export { parseJavaScript } from "./acorn-adapter.js";
export { parseTypeScript } from "./typescript-estree-adapter.js";
export {
  loadSourceFile,
  ensureTargetSourceFile,
  isSupportedJavaScriptPath,
  isSupportedPath,
} from "./load-source-file.js";
export {
  registerBackend,
  getBackendForPath,
  getBackendById,
  listExtensions,
  listBackends,
  registerBuiltInBackends,
  ensureBuiltInBackends,
} from "./registry.js";
