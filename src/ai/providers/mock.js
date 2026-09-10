/**
 * @typedef {object} AiExplainRequest
 * @property {string} targetPath
 * @property {string} [sourceSnippet]
 * @property {object[]} findings
 * @property {object[]} [diagnostics]
 * @property {object} options
 */

/**
 * @typedef {object} AiExplanation
 * @property {string} [refCode]
 * @property {{line:number, column:number}|null} [loc]
 * @property {string} summary
 * @property {string} detail
 * @property {"quality"|"validation"|"general"} scope
 */

/**
 * @typedef {object} AiProvider
 * @property {string} id
 * @property {(req: AiExplainRequest) => Promise<{ explanations: AiExplanation[], raw?: unknown }>} explain
 */

/**
 * Детерминированный mock для тестов.
 * @type {AiProvider}
 */
export const mockAiProvider = {
  id: "mock",
  async explain(req) {
    /** @type {AiExplanation[]} */
    const explanations = [];
    for (const f of req.findings ?? []) {
      explanations.push({
        refCode: f.code,
        loc: f.loc ?? null,
        scope: "quality",
        summary: `Пояснение: ${f.code}`,
        detail: `Mock: ${f.message ?? f.code}. Рекомендация — устранить сигнал качества.`,
      });
    }
    for (const d of req.diagnostics ?? []) {
      explanations.push({
        refCode: d.code,
        loc: d.loc ?? null,
        scope: "validation",
        summary: `Пояснение: ${d.code}`,
        detail: `Mock: ${d.message ?? d.code}. Проверьте зависимости и импорты.`,
      });
    }
    if (explanations.length === 0) {
      explanations.push({
        scope: "general",
        summary: "Нет findings для пояснения",
        detail: "Mock provider: вход пуст.",
        loc: null,
      });
    }
    return { explanations };
  },
};
