/**
 * Публичный API parsers. Инспекторы и core используют только этот модуль,
 * не `acorn` напрямую (ADR-0001).
 */
export { ParserError } from "./errors.js";
export { parseJavaScript } from "./acorn-adapter.js";
export {
  loadSourceFile,
  ensureTargetSourceFile,
  isSupportedJavaScriptPath,
} from "./load-source-file.js";
