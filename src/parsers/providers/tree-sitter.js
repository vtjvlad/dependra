/**
 * Null-object Tree-sitter provider (S09-C stub).
 * @see docs/20-architecture/language-backend.md
 */

/**
 * @typedef {import('../registry.js').LanguageId} LanguageId
 */

/** @type {import('../registry.js').TreeSitterProvider} */
export const nullTreeSitterProvider = {
  isAvailable() {
    return false;
  },
  async parse(_sourceText, _languageId) {
    return null;
  },
};
