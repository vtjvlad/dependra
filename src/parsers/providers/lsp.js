/**
 * Null-object LSP provider (S09-C stub).
 * @see docs/20-architecture/language-backend.md
 */

/** @type {import('../registry.js').LspProvider} */
export const nullLspProvider = {
  isAvailable() {
    return false;
  },
  async query(_absPath, _sourceText) {
    return null;
  },
};
