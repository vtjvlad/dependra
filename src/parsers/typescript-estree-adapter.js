import { parse } from "@typescript-eslint/typescript-estree";
import { ParserError } from "./errors.js";

/**
 * Единственная точка импорта typescript-estree (ADR-0003).
 *
 * @param {string} sourceText
 * @param {{ filePath?: string, jsx?: boolean }} [options]
 * @returns {object} ESTree (+ TS) Program
 */
export function parseTypeScript(sourceText, options = {}) {
  try {
    return parse(sourceText, {
      loc: true,
      range: true,
      jsx: options.jsx === true,
      comment: false,
      tokens: false,
      errorOnUnknownASTType: false,
    });
  } catch (err) {
    const loc =
      err && typeof err === "object"
        ? /** @type {{ lineNumber?: number, column?: number, loc?: { line?: number, column?: number } }} */ (
            err
          )
        : undefined;
    const line = loc?.lineNumber ?? loc?.loc?.line;
    const column = loc?.column ?? loc?.loc?.column;
    throw new ParserError(
      "PARSE_FAILED",
      `Не удалось разобрать файл как TypeScript${options.filePath ? `: ${options.filePath}` : ""}`,
      "execution",
      {
        filePath: options.filePath,
        line,
        column,
        cause: err instanceof Error ? err.message : String(err),
      },
    );
  }
}
