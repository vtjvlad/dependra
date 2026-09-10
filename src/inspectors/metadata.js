/**
 * Metadata inspector (S05) — docs/20-features/analysis/metadata.md
 */

import {
  listMetadataProviders,
  registerMetadataProvider,
} from "../metadata/registry.js";
import {
  embeddedTextProvider,
  exifStubProvider,
  fileMeta,
  fsExtendedProvider,
} from "../metadata/providers.js";

/**
 * @typedef {import('../core/types.js').AnalysisContext} AnalysisContext
 * @typedef {import('../core/types.js').Inspector} Inspector
 * @typedef {import('../core/types.js').InspectorResult} InspectorResult
 */

let builtinsRegistered = false;

function ensureBuiltins() {
  if (builtinsRegistered) return;
  registerMetadataProvider(fsExtendedProvider);
  registerMetadataProvider(embeddedTextProvider);
  registerMetadataProvider(exifStubProvider);
  builtinsRegistered = true;
}

/**
 * @param {AnalysisContext} ctx
 * @returns {Promise<InspectorResult>}
 */
async function analyze(ctx) {
  ensureBuiltins();
  const pathMode = ctx.options.pathMode ?? "relative";
  const meta = fileMeta(ctx.targetPath);

  /** @type {object[]} */
  const providersOut = [];
  /** @type {object[]} */
  const skippedProviders = [];

  for (const provider of listMetadataProviders()) {
    try {
      if (!provider.supports(meta)) {
        skippedProviders.push({
          id: provider.id,
          reason: "unsupported-type",
        });
        continue;
      }
      const result = await provider.extract({
        targetPath: ctx.targetPath,
        cwd: ctx.cwd,
        pathMode,
        meta,
      });
      if (result?.skip) {
        skippedProviders.push({
          id: provider.id,
          reason: result.reason ?? "skipped",
        });
        continue;
      }
      providersOut.push({
        id: provider.id,
        status: "ok",
        data: result.data ?? {},
      });
    } catch {
      skippedProviders.push({
        id: provider.id,
        reason: "extract-failed",
      });
    }
  }

  return {
    inspectorId: "metadata",
    status: "ok",
    data: {
      pathMode,
      providers: providersOut,
      skippedProviders,
    },
  };
}

/** @type {Inspector} */
export const metadataInspector = {
  meta: {
    id: "metadata",
    version: "0.0.1",
    tags: ["U"],
  },
  analyze,
};
