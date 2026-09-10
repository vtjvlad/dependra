/**
 * TUI color themes (neo-blessed style attrs).
 */

/**
 * @typedef {object} TuiTheme
 * @property {string} name
 * @property {string} bg
 * @property {string} fg
 * @property {string} border
 * @property {string} focusBorder
 * @property {string} header
 * @property {string} dim
 * @property {string} selectedBg
 * @property {string} selectedFg
 * @property {string} popupBg
 * @property {string} accent
 */

/** @type {Record<string, TuiTheme>} */
const THEMES = {
  default: {
    name: "default",
    bg: "black",
    fg: "white",
    border: "gray",
    focusBorder: "cyan",
    header: "cyan",
    dim: "gray",
    selectedBg: "blue",
    selectedFg: "white",
    popupBg: "black",
    accent: "green",
  },
  dim: {
    name: "dim",
    bg: "black",
    fg: "white",
    border: "#555555",
    focusBorder: "#888888",
    header: "white",
    dim: "#666666",
    selectedBg: "#333333",
    selectedFg: "white",
    popupBg: "black",
    accent: "white",
  },
};

/**
 * @param {string} [name]
 * @returns {TuiTheme}
 */
export function getTheme(name = "default") {
  return THEMES[name] ?? THEMES.default;
}

/**
 * @returns {string[]}
 */
export function listThemeNames() {
  return Object.keys(THEMES);
}
