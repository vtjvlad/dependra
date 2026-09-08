/**
 * Терминальный стиль schematic-отчёта.
 * Цвет только при TTY и без NO_COLOR.
 */

const FORCE =
  process.env.FORCE_COLOR === "1" || process.env.FORCE_COLOR === "true";
const NO =
  process.env.NO_COLOR != null && process.env.NO_COLOR !== "" ||
  process.env.FORCE_COLOR === "0";

/** @returns {boolean} */
export function useColor() {
  if (NO) return false;
  if (FORCE) return true;
  return Boolean(process.stdout.isTTY);
}

/**
 * @param {boolean} enabled
 */
export function createPalette(enabled) {
  const wrap =
    (open, close = "\u001b[0m") =>
    /** @param {string} s */
    (s) => (enabled ? `${open}${s}${close}` : s);

  return {
    enabled,
    reset: wrap("\u001b[0m"),
    bold: wrap("\u001b[1m"),
    dim: wrap("\u001b[2m"),
    red: wrap("\u001b[31m"),
    green: wrap("\u001b[32m"),
    yellow: wrap("\u001b[33m"),
    cyan: wrap("\u001b[36m"),
    magenta: wrap("\u001b[35m"),
    white: wrap("\u001b[37m"),
  };
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return String(bytes);
  if (bytes < 1000) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let n = bytes;
  let i = -1;
  do {
    n /= 1000;
    i += 1;
  } while (n >= 1000 && i < units.length - 1);
  return `${n.toFixed(n >= 10 || i === 0 ? 1 : 2)} ${units[i]}`;
}

/**
 * @param {string} absPath
 * @param {string} cwd
 * @returns {string}
 */
export function shortPath(absPath, cwd) {
  if (!absPath) return "";
  if (absPath === cwd) return ".";
  if (absPath.startsWith(`${cwd}/`) || absPath.startsWith(`${cwd}\\`)) {
    return absPath.slice(cwd.length + 1);
  }
  return absPath;
}

/**
 * Рамка секции schematic.
 *
 * @param {string} title
 * @param {string[]} bodyLines
 * @param {ReturnType<typeof createPalette>} pal
 * @param {number} [minInner=52]
 * @returns {string[]}
 */
export function frameSection(title, bodyLines, pal, minInner = 52) {
  const label = ` ${title} `;
  const width = Math.max(
    minInner,
    label.length,
    ...bodyLines.map((l) => visibleWidth(l)),
  );
  // Между углами: `─` + label + `─…`  ==  ` ` + content + ` `
  const bar = width + 2;
  const afterLabel = Math.max(0, bar - 1 - label.length);

  const top =
    pal.dim("┌─") +
    pal.bold(pal.cyan(label)) +
    pal.dim(`${"─".repeat(afterLabel)}┐`);

  /** @type {string[]} */
  const out = [top];
  for (const line of bodyLines) {
    const pad = width - visibleWidth(line);
    out.push(
      `${pal.dim("│")} ${line}${" ".repeat(Math.max(0, pad))} ${pal.dim("│")}`,
    );
  }
  out.push(pal.dim(`└${"─".repeat(bar)}┘`));
  return out;
}

/**
 * Ширина строки без ANSI.
 * @param {string} s
 * @returns {number}
 */
export function visibleWidth(s) {
  return s.replace(/\u001b\[[0-9;]*m/g, "").length;
}
