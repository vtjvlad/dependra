/**
 * strip-comments op — keep /*! license headers.
 */

import {
  displayPath,
  getWorkingText,
  makeUpdateChange,
  nextChangeId,
  parseWithComments,
  setWorkingText,
} from "./_helpers.js";

/**
 * @param {string} source
 * @returns {string}
 */
export function stripCommentsKeepLicense(source) {
  const { comments } = parseWithComments(source);
  if (comments.length === 0) return source;

  const remove = comments.filter((c) => {
    if (c.type === "Block" && c.value.startsWith("!")) return false;
    // keep first block doc that looks like copyright
    if (
      c.type === "Block" &&
      c.start < 40 &&
      /copyright|license|©/i.test(c.value)
    ) {
      return false;
    }
    return true;
  });
  if (remove.length === 0) return source;

  const sorted = [...remove].sort((a, b) => b.start - a.start);
  let out = source;
  for (const c of sorted) {
    let start = c.start;
    let end = c.end;
    // drop following newline for line comments when alone
    if (c.type === "Line" && out[end] === "\n") end += 1;
    out = out.slice(0, start) + out.slice(end);
  }
  return out;
}

/**
 * @param {import('../../core/types.js').AnalysisContext} ctx
 * @param {object} _results
 * @param {object} state
 */
export function buildStripCommentsChanges(ctx, _results, state) {
  const path = ctx.targetPath;
  const before = getWorkingText(state, path);
  let after;
  try {
    after = stripCommentsKeepLicense(before);
  } catch {
    return [
      makeUpdateChange({
        id: nextChangeId(state),
        path,
        display: displayPath(path, ctx.options.pathMode, ctx.cwd),
        op: "strip-comments",
        summary: "parse failed",
        before,
        after: before,
        risk: "caution",
        skippedReason: "PARSE_FAILED",
      }),
    ];
  }
  if (before === after) return [];
  setWorkingText(state, path, after);
  return [
    makeUpdateChange({
      id: nextChangeId(state),
      path,
      display: displayPath(path, ctx.options.pathMode, ctx.cwd),
      op: "strip-comments",
      summary: "remove comments (keep /*! / license)",
      before,
      after,
      risk: "caution",
    }),
  ];
}

export const stripCommentsOp = {
  id: "strip-comments",
  build: buildStripCommentsChanges,
};
