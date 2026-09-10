/**
 * OpenAI-compatible chat adapter (тонкий HTTPS, без SDK).
 */

/**
 * @typedef {import('./mock.js').AiProvider} AiProvider
 * @typedef {import('./mock.js').AiExplanation} AiExplanation
 */

/**
 * @param {unknown} value
 * @returns {AiExplanation[]}
 */
function normalizeExplanations(value) {
  if (!Array.isArray(value)) return [];
  /** @type {AiExplanation[]} */
  const out = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = /** @type {Record<string, unknown>} */ (item);
    if (typeof o.summary !== "string" || typeof o.detail !== "string") continue;
    const scope =
      o.scope === "quality" || o.scope === "validation" || o.scope === "general"
        ? o.scope
        : "general";
    out.push({
      refCode: typeof o.refCode === "string" ? o.refCode : undefined,
      loc:
        o.loc && typeof o.loc === "object"
          ? /** @type {{line:number, column:number}} */ (o.loc)
          : null,
      summary: o.summary,
      detail: o.detail,
      scope,
    });
  }
  return out;
}

/**
 * @type {AiProvider}
 */
export const openaiAiProvider = {
  id: "openai",
  async explain(req) {
    const ai = req.options ?? {};
    const apiKeyEnv = ai.apiKeyEnv || "DEPENDRA_AI_API_KEY";
    const apiKey = process.env[apiKeyEnv];
    if (!apiKey) {
      const err = new Error("missing-api-key");
      err.name = "AiSkipError";
      /** @type {any} */ (err).skipReason = "missing-api-key";
      throw err;
    }

    const baseUrl = (ai.baseUrl || "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    );
    const model = ai.model || "gpt-4o-mini";
    const timeoutMs = Number(ai.timeoutMs) || 30000;

    const payload = {
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You explain code-quality and validation findings. Reply with JSON only: {\"explanations\":[{\"refCode\":\"\",\"loc\":null,\"scope\":\"quality\",\"summary\":\"\",\"detail\":\"\"}]}",
        },
        {
          role: "user",
          content: JSON.stringify({
            targetPath: req.targetPath,
            findings: req.findings,
            diagnostics: req.diagnostics,
            snippet: req.sourceSnippet?.slice(0, 4000) ?? "",
          }),
        },
      ],
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        const e = new Error("timeout");
        e.name = "AiSkipError";
        /** @type {any} */ (e).skipReason = "timeout";
        throw e;
      }
      const e = new Error(
        err instanceof Error ? err.message : "provider-error",
      );
      e.name = "AiSkipError";
      /** @type {any} */ (e).skipReason = "provider-error";
      throw e;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const e = new Error(`HTTP ${response.status}`);
      e.name = "AiSkipError";
      /** @type {any} */ (e).skipReason = "provider-error";
      throw e;
    }

    let raw;
    try {
      raw = await response.json();
    } catch {
      const e = new Error("parse-response");
      e.name = "AiSkipError";
      /** @type {any} */ (e).skipReason = "parse-response";
      throw e;
    }

    const content =
      raw?.choices?.[0]?.message?.content ??
      raw?.choices?.[0]?.message?.text ??
      "";
    let parsed;
    try {
      const text = String(content).trim();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      const slice =
        jsonStart >= 0 && jsonEnd > jsonStart
          ? text.slice(jsonStart, jsonEnd + 1)
          : text;
      parsed = JSON.parse(slice);
    } catch {
      const e = new Error("parse-response");
      e.name = "AiSkipError";
      /** @type {any} */ (e).skipReason = "parse-response";
      throw e;
    }

    const explanations = normalizeExplanations(parsed?.explanations);
    if (explanations.length === 0) {
      const e = new Error("parse-response");
      e.name = "AiSkipError";
      /** @type {any} */ (e).skipReason = "parse-response";
      throw e;
    }

    return { explanations, raw };
  },
};
