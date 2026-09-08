import { parse as acornParse } from "acorn";
import { ParserError } from "./errors.js";

/**
 * Единственная точка импорта Acorn (ADR-0001).
 *
 * @param {string} sourceText
 * @param {{ filePath?: string }} [options]
 * @returns {object} ESTree Program
 */
export function parseJavaScript(sourceText, options = {}) {
  try {
    return acornParse(sourceText, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
      allowHashBang: true,
      allowReturnOutsideFunction: true,
    });
  } catch (err) {
    const loc = err && typeof err === "object" ? err.loc : undefined;
    throw new ParserError(
      "PARSE_FAILED",
      `Не удалось разобрать файл как JavaScript${options.filePath ? `: ${options.filePath}` : ""}`,
      "execution",
      {
        filePath: options.filePath,
        line: loc?.line,
        column: loc?.column,
        cause: err instanceof Error ? err.message : String(err),
      },
    );
  }
}
