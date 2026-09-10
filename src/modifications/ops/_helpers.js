/**
 * Shared helpers for modification ops.
 */

import { parse as acornParse } from "acorn";
import { readFileSync } from "node:fs";
import { basename, relative } from "node:path";
import { ParserError } from "../../parsers/errors.js";

/**
 * @param {string} absPath
 * @param {"name"|"relative"|"absolute"} pathMode
 * @param {string} cwd
 */
export function displayPath(absPath, pathMode, cwd) {
  if (pathMode === "name") return basename(absPath);
  if (pathMode === "absolute") return absPath;
  const rel = relative(cwd, absPath);
  return rel.startsWith("..") ? absPath : rel;
}

/**
 * @param {string} before
 * @param {string} after
 * @param {string} [label]
 * @returns {string}
 */
export function simpleUnifiedDiff(before, after, label = "file") {
  if (before === after) return "";
  const a = before.split(/\r?\n/);
  const b = after.split(/\r?\n/);
  const lines = [`--- a/${label}`, `+++ b/${label}`];
  /** @type {string[]} */
  let hunk = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left === right) continue;
    if (left !== undefined) hunk.push(`-${left}`);
    if (right !== undefined) hunk.push(`+${right}`);
  }
  if (hunk.length > 40) {
    hunk = [...hunk.slice(0, 20), "@@ … @@", ...hunk.slice(-20)];
  }
  const removed = hunk.filter((l) => l.startsWith("-")).length;
  const added = hunk.filter((l) => l.startsWith("+")).length;
  lines.push(`@@ changes ${removed}/${added} @@`);
  lines.push(...hunk);
  return lines.join("\n");
}

/**
 * @param {string} path
 * @returns {string}
 */
export function readText(path) {
  return readFileSync(path, "utf8");
}

/**
 * @param {string} sourceText
 * @param {{ filePath?: string }} [options]
 * @returns {{ ast: object, comments: { type: string, value: string, start: number, end: number }[] }}
 */
export function parseWithComments(sourceText, options = {}) {
  /** @type {{ type: string, value: string, start: number, end: number }[]} */
  const comments = [];
  try {
    const ast = acornParse(sourceText, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
      allowHashBang: true,
      allowReturnOutsideFunction: true,
      ranges: true,
      onComment(block, text, start, end) {
        comments.push({
          type: block ? "Block" : "Line",
          value: text,
          start,
          end,
        });
      },
    });
    return { ast, comments };
  } catch (err) {
    const loc = err && typeof err === "object" ? /** @type {any} */ (err).loc : undefined;
    throw new ParserError(
      "PARSE_FAILED",
      `Не удалось разобрать файл как JavaScript${options.filePath ? `: ${options.filePath}` : ""}`,
      "execution",
      {
        filePath: options.filePath,
        line: loc?.line,
        column: loc?.column,
        cause: err instanceof Error ? err.message : String(err),
      },
    );
  }
}

/**
 * Mutable working text for chaining ops in one pass.
 * @param {object} state
 * @param {string} path
 * @returns {string}
 */
export function getWorkingText(state, path) {
  if (state.texts?.[path] != null) return state.texts[path];
  const text = readText(path);
  if (!state.texts) state.texts = {};
  state.texts[path] = text;
  return text;
}

/**
 * @param {object} state
 * @param {string} path
 * @param {string} text
 */
export function setWorkingText(state, path, text) {
  if (!state.texts) state.texts = {};
  state.texts[path] = text;
}

/**
 * Truncate for JSON report.
 * @param {string} s
 * @param {number} [max]
 */
export function truncate(s, max = 4000) {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n…`;
}

/**
 * @param {object} opts
 * @returns {import('../types.js').Change}
 */
export function makeUpdateChange(opts) {
  const {
    id,
    path,
    display,
    op,
    summary,
    before,
    after,
    risk = "safe",
    loc = null,
    details = undefined,
    skippedReason = undefined,
  } = opts;
  return {
    id,
    kind: "update",
    path,
    display,
    op,
    summary,
    before: truncate(before),
    after: truncate(after),
    diff: simpleUnifiedDiff(before, after, display ?? "file"),
    loc,
    selected: !skippedReason,
    risk,
    details,
    skippedReason,
  };
}

/**
 * Allocate sequential change ids on state.
 * @param {object} state
 * @returns {string}
 */
export function nextChangeId(state) {
  state._cid = (state._cid ?? 0) + 1;
  return `c${state._cid}`;
}
