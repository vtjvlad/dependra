import * as acorn from "acorn";
import jsx from "acorn-jsx";
import { ParserError } from "./errors.js";

/** @type {typeof acorn.Parser} */
const JsxParser = acorn.Parser.extend(jsx());

/**
 * Единственная точка импорта Acorn / acorn-jsx (ADR-0001, ADR-0004).
 *
 * @param {string} sourceText
 * @param {{ filePath?: string, jsx?: boolean }} [options]
 * @returns {object} ESTree Program
 */
export function parseJavaScript(sourceText, options = {}) {
  const useJsx = options.jsx === true;
  const parser = useJsx ? JsxParser : acorn.Parser;
  try {
    return parser.parse(sourceText, {
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
