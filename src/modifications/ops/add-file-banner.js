/**
 * add-file-banner op.
 */

import {
  displayPath,
  getWorkingText,
  makeUpdateChange,
  nextChangeId,
  setWorkingText,
} from "./_helpers.js";

const BANNER = "/** @file generated banner — dependra */\n";

/**
 * @param {string} source
 * @returns {string}
 */
export function ensureFileBanner(source) {
  if (/@file\b/.test(source.slice(0, 200))) return source;
  if (source.startsWith("#!")) {
    const nl = source.indexOf("\n");
    if (nl === -1) return `${source}\n${BANNER}`;
    return `${source.slice(0, nl + 1)}${BANNER}${source.slice(nl + 1)}`;
  }
  return BANNER + source;
}

/**
 * @param {import('../../core/types.js').AnalysisContext} ctx
 * @param {object} _results
 * @param {object} state
 */
export function buildCommentBannerChanges(ctx, _results, state) {
  const path = ctx.targetPath;
  const before = getWorkingText(state, path);
  const after = ensureFileBanner(before);
  if (before === after) return [];
  setWorkingText(state, path, after);
  return [
    makeUpdateChange({
      id: nextChangeId(state),
      path,
      display: displayPath(path, ctx.options.pathMode, ctx.cwd),
      op: "add-file-banner",
      summary: "add file banner comment",
      before,
      after,
      risk: "safe",
    }),
  ];
}

export const addFileBannerOp = {
  id: "add-file-banner",
  build: buildCommentBannerChanges,
};
