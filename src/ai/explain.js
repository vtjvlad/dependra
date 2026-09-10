import { getAiProvider, registerAiProvider } from "./registry.js";
import { mockAiProvider } from "./providers/mock.js";
import { openaiAiProvider } from "./providers/openai.js";

registerAiProvider(mockAiProvider);
registerAiProvider(openaiAiProvider);

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

/**
 * @param {string} reason
 * @param {object} ai
 * @returns {InspectorResult}
 */
function skippedResult(reason, ai) {
  return {
    inspectorId: "ai-explain",
    status: "ok",
    data: {
      provider: ai?.provider ?? null,
      model: ai?.model ?? null,
      skipped: true,
      skipReason: reason,
      explanations: [],
    },
  };
}

/**
 * AI explain pass (S06). Никогда не валит pipeline fatal-ом.
 *
 * @param {AnalysisContext} ctx
 * @param {Object.<string, InspectorResult>} results
 * @returns {Promise<InspectorResult>}
 */
export async function runAiExplain(ctx, results) {
  const ai = ctx.options.ai ?? {};

  if (!ai.enabled) {
    return skippedResult("ai-disabled", ai);
  }

  const quality = results["code-quality-analysis"];
  const validation = results.validation;
  const findings =
    quality?.status === "ok" && Array.isArray(quality.data?.findings)
      ? quality.data.findings
      : [];
  const diagnostics =
    validation?.status === "ok" && Array.isArray(validation.data?.diagnostics)
      ? validation.data.diagnostics
      : [];

  if (findings.length === 0 && diagnostics.length === 0) {
    return skippedResult("nothing-to-explain", ai);
  }

  const providerId = ai.provider || "openai";
  const provider = getAiProvider(providerId);
  if (!provider) {
    return skippedResult("provider-unavailable", ai);
  }

  const apiKeyEnv = ai.apiKeyEnv || "DEPENDRA_AI_API_KEY";
  if (providerId !== "mock" && !process.env[apiKeyEnv]) {
    return skippedResult("missing-api-key", ai);
  }

  const sourceText =
    ctx.projectModel?.files?.[ctx.targetPath]?.sourceText ?? undefined;

  try {
    const { explanations } = await provider.explain({
      targetPath: ctx.targetPath,
      sourceSnippet: sourceText,
      findings,
      diagnostics,
      options: ai,
    });
    return {
      inspectorId: "ai-explain",
      status: "ok",
      data: {
        provider: providerId,
        model: ai.model ?? null,
        skipped: false,
        skipReason: null,
        explanations,
      },
    };
  } catch (err) {
    const reason =
      /** @type {any} */ (err)?.skipReason ||
      (err instanceof Error && err.name === "AbortError"
        ? "timeout"
        : "provider-error");
    return skippedResult(reason, ai);
  }
}
