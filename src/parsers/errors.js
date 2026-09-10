/**
 * Ошибки модуля parsers (коды согласованы с import-export-analysis.md).
 */
export class ParserError extends Error {
  /**
   * @param {"FILE_NOT_FOUND"|"UNSUPPORTED_LANGUAGE"|"PARSE_FAILED"|"READ_FAILED"} code
   * @param {string} message
   * @param {"validation"|"execution"} category
   * @param {object} [details]
   */
  constructor(code, message, category, details) {
    super(message);
    this.name = "ParserError";
    this.code = code;
    this.category = category;
    this.details = details ?? {};
    this.retryable = false;
  }
}
