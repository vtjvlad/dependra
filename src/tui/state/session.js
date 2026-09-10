/**
 * TUI session state + prefs persistence.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { isThemeName } from "../theme.js";

/**
 * @typedef {object} TuiPrefs
 * @property {string} theme
 * @property {boolean} showHidden
 * @property {boolean} showKeyHints
 */

/**
 * @returns {string}
 */
export function resolveTuiPrefsPath() {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base =
    xdg && xdg.length > 0 ? join(xdg, "dependra") : join(homedir(), ".config", "dependra");
  return join(base, "tui.json");
}

/**
 * @returns {TuiPrefs}
 */
export function defaultTuiPrefs() {
  return {
    theme: "default",
    showHidden: false,
    showKeyHints: true,
  };
}

/**
 * @returns {TuiPrefs}
 */
export function loadTuiPrefs() {
  const path = resolveTuiPrefsPath();
  const base = defaultTuiPrefs();
  if (!existsSync(path)) return base;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    const theme =
      typeof raw.theme === "string" && isThemeName(raw.theme)
        ? raw.theme
        : "default";
    return {
      theme,
      showHidden: Boolean(raw.showHidden),
      showKeyHints: raw.showKeyHints !== false,
    };
  } catch {
    return base;
  }
}

/**
 * @param {TuiPrefs} prefs
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function saveTuiPrefs(prefs) {
  const path = resolveTuiPrefsPath();
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(prefs, null, 2)}\n`, "utf8");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/**
 * @param {string} cwd
 * @param {string} projectRoot
 * @returns {object}
 */
export function createSession(cwd, projectRoot) {
  return {
    cwd,
    projectRoot,
    currentDir: projectRoot,
    selectedPath: null,
    lastReport: null,
    lastText: null,
    filter: "",
    prefs: loadTuiPrefs(),
    confModel: null,
    confPath: null,
  };
}
