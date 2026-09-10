/**
 * format op — normalize trailing whitespace, blanks, final newline.
 */

import {
  displayPath,
  getWorkingText,
  makeUpdateChange,
  nextChangeId,
  setWorkingText,
} from "./_helpers.js";

/**
 * @param {string} source
 * @returns {string}
 */
export function formatSource(source) {
  let text = source.replace(/\r\n/g, "\n");
  const lines = text.split("\n").map((l) => l.replace(/[ \t]+$/g, ""));
  /** @type {string[]} */
  const out = [];
  let blankRun = 0;
  for (const line of lines) {
    if (line === "") {
      blankRun += 1;
      if (blankRun <= 1) out.push("");
    } else {
      blankRun = 0;
      out.push(line);
    }
  }
  text = out.join("\n");
  if (!text.endsWith("\n")) text += "\n";
  return text;
}

/**
 * @param {import('../../core/types.js').AnalysisContext} ctx
 * @param {object} _results
 * @param {object} state
 * @returns {import('../types.js').Change[]}
 */
export function buildFormatChanges(ctx, _results, state) {
  const path = ctx.targetPath;
  const before = getWorkingText(state, path);
  const after = formatSource(before);
  if (before === after) return [];
  setWorkingText(state, path, after);
  return [
    makeUpdateChange({
      id: nextChangeId(state),
      path,
      display: displayPath(path, ctx.options.pathMode, ctx.cwd),
      op: "format",
      summary: "normalize whitespace / blank lines / final newline",
      before,
      after,
      risk: "safe",
    }),
  ];
}

export const formatOp = {
  id: "format",
  build: buildFormatChanges,
};
