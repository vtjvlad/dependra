/**
 * AI modify op (optional).
 */

import { getAiProvider, registerAiProvider } from "../../ai/registry.js";
import { mockAiProvider } from "../../ai/providers/mock.js";
import { openaiAiProvider } from "../../ai/providers/openai.js";
import { ParserError } from "../../parsers/errors.js";
import {
  displayPath,
  getWorkingText,
  makeUpdateChange,
  nextChangeId,
  parseWithComments,
  setWorkingText,
} from "./_helpers.js";

let providersReady = false;
function ensureProviders() {
  if (providersReady) return;
  registerAiProvider(mockAiProvider);
  registerAiProvider(openaiAiProvider);
  providersReady = true;
}

/**
 * @param {import('../../core/types.js').AnalysisContext} ctx
 * @param {object} results
 * @param {object} state
 */
export async function buildAiModifyChanges(ctx, results, state) {
  ensureProviders();
  const path = ctx.targetPath;
  const display = displayPath(path, ctx.options.pathMode, ctx.cwd);
  const before = getWorkingText(state, path);
  const ai = ctx.options.ai ?? {};

  if (!ai.enabled) {
    return [
      makeUpdateChange({
        id: nextChangeId(state),
        path,
        display,
        op: "ai-modify",
        summary: "skipped: ai-disabled",
        before,
        after: before,
        risk: "dangerous",
        skippedReason: "ai-disabled",
      }),
    ];
  }

  const envName = ai.apiKeyEnv || "DEPENDRA_AI_API_KEY";
  const key = process.env[envName];
  if (ai.provider !== "mock" && (!key || String(key).trim() === "")) {
    return [
      makeUpdateChange({
        id: nextChangeId(state),
        path,
        display,
        op: "ai-modify",
        summary: "skipped: missing-api-key",
        before,
        after: before,
        risk: "dangerous",
        skippedReason: "missing-api-key",
      }),
    ];
  }

  const provider = getAiProvider(ai.provider || "openai");
  if (!provider) {
    return [
      makeUpdateChange({
        id: nextChangeId(state),
        path,
        display,
        op: "ai-modify",
        summary: "skipped: provider-unavailable",
        before,
        after: before,
        risk: "dangerous",
        skippedReason: "provider-unavailable",
      }),
    ];
  }

  const findings =
    results["code-quality-analysis"]?.status === "ok"
      ? results["code-quality-analysis"].data?.findings ?? []
      : [];
  const diagnostics =
    results.validation?.status === "ok"
      ? results.validation.data?.diagnostics ?? []
      : [];

  let after = before;
  try {
    if (typeof provider.modify === "function") {
      const res = await provider.modify({
        targetPath: path,
        source: before,
        instruction: ctx.options.aimInstruction ?? null,
        findings,
        diagnostics,
        options: ai,
      });
      if (res?.after) after = res.after;
    } else if (provider.id === "mock") {
      // deterministic mock patch: ensure trailing newline + banner marker
      after = before.includes("/* dependra-ai-mod */")
        ? before
        : `/* dependra-ai-mod */\n${before.endsWith("\n") ? before : `${before}\n`}`;
    } else {
      return [
        makeUpdateChange({
          id: nextChangeId(state),
          path,
          display,
          op: "ai-modify",
          summary: "skipped: provider-no-modify",
          before,
          after: before,
          risk: "dangerous",
          skippedReason: "provider-unavailable",
        }),
      ];
    }
  } catch (err) {
    return [
      makeUpdateChange({
        id: nextChangeId(state),
        path,
        display,
        op: "ai-modify",
        summary: `skipped: ${err instanceof Error ? err.message : "provider-error"}`,
        before,
        after: before,
        risk: "dangerous",
        skippedReason: "provider-error",
      }),
    ];
  }

  try {
    parseWithComments(after, { filePath: path });
  } catch (err) {
    if (err instanceof ParserError) {
      return [
        makeUpdateChange({
          id: nextChangeId(state),
          path,
          display,
          op: "ai-modify",
          summary: "AI after failed parse",
          before,
          after: before,
          risk: "dangerous",
          skippedReason: "PARSE_FAILED",
        }),
      ];
    }
    throw err;
  }

  if (after === before) return [];
  setWorkingText(state, path, after);
  return [
    makeUpdateChange({
      id: nextChangeId(state),
      path,
      display,
      op: "ai-modify",
      summary: "AI suggested patch",
      before,
      after,
      risk: "dangerous",
    }),
  ];
}

export const aiModifyOp = {
  id: "ai-modify",
  build: buildAiModifyChanges,
};
