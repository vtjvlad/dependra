/**
 * TUI color themes (neo-blessed style attrs).
 */

/**
 * @typedef {object} TuiTheme
 * @property {string} name
 * @property {string} label
 * @property {string} help
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
    label: "Default",
    help: "cyan + green на чёрном — базовая схема",
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
    label: "Dim",
    help: "приглушённая серая схема без ярких акцентов",
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
  ocean: {
    name: "ocean",
    label: "Ocean",
    help: "глубокий синий: спокойные границы и акцент aqua",
    bg: "#0b1220",
    fg: "#d8e1f0",
    border: "#2a3b55",
    focusBorder: "#4fc3f7",
    header: "#7dd3fc",
    dim: "#6b7c93",
    selectedBg: "#1e3a5f",
    selectedFg: "#e0f2fe",
    popupBg: "#0f172a",
    accent: "#2dd4bf",
  },
  forest: {
    name: "forest",
    label: "Forest",
    help: "зелёные акценты, тёмный фон",
    bg: "#0c1210",
    fg: "#e7efe8",
    border: "#2f4a3a",
    focusBorder: "#4ade80",
    header: "#86efac",
    dim: "#6b7f72",
    selectedBg: "#14532d",
    selectedFg: "#f0fdf4",
    popupBg: "#0f1a14",
    accent: "#22c55e",
  },
  amber: {
    name: "amber",
    label: "Amber",
    help: "тёплый янтарь / песок",
    bg: "#140f0a",
    fg: "#f5e6d3",
    border: "#5c4030",
    focusBorder: "#f59e0b",
    header: "#fbbf24",
    dim: "#8a735a",
    selectedBg: "#78350f",
    selectedFg: "#fffbeb",
    popupBg: "#1a140e",
    accent: "#f59e0b",
  },
  slate: {
    name: "slate",
    label: "Slate",
    help: "нейтральный серо-голубой, низкий контраст",
    bg: "#0f1419",
    fg: "#e2e8f0",
    border: "#334155",
    focusBorder: "#94a3b8",
    header: "#cbd5e1",
    dim: "#64748b",
    selectedBg: "#1e293b",
    selectedFg: "#f8fafc",
    popupBg: "#111827",
    accent: "#38bdf8",
  },
  crimson: {
    name: "crimson",
    label: "Crimson",
    help: "тёмный фон с красно-розовым акцентом",
    bg: "#120a0c",
    fg: "#f3e8ea",
    border: "#5c2a35",
    focusBorder: "#fb7185",
    header: "#fda4af",
    dim: "#8b6b72",
    selectedBg: "#4c0519",
    selectedFg: "#fff1f2",
    popupBg: "#1a0f12",
    accent: "#f43f5e",
  },
  nord: {
    name: "nord",
    label: "Nord",
    help: "холодная палитра в духе Nord",
    bg: "#2e3440",
    fg: "#eceff4",
    border: "#4c566a",
    focusBorder: "#88c0d0",
    header: "#8fbcbb",
    dim: "#7b88a1",
    selectedBg: "#3b4252",
    selectedFg: "#eceff4",
    popupBg: "#3b4252",
    accent: "#a3be8c",
  },
  mono: {
    name: "mono",
    label: "Mono",
    help: "строго чёрно-белая схема",
    bg: "black",
    fg: "white",
    border: "white",
    focusBorder: "white",
    header: "white",
    dim: "gray",
    selectedBg: "white",
    selectedFg: "black",
    popupBg: "black",
    accent: "white",
  },
  paper: {
    name: "paper",
    label: "Paper",
    help: "светлый «бумажный» фон (высокий контраст)",
    bg: "#f4f1ea",
    fg: "#1c1917",
    border: "#a8a29e",
    focusBorder: "#0f766e",
    header: "#0f766e",
    dim: "#78716c",
    selectedBg: "#ccfbf1",
    selectedFg: "#134e4a",
    popupBg: "#fafaf9",
    accent: "#b45309",
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

/**
 * Human-readable label for a theme id.
 * @param {string} name
 * @returns {string}
 */
export function themeLabel(name) {
  return getTheme(name).label ?? name;
}

/**
 * Short help for a theme id.
 * @param {string} name
 * @returns {string}
 */
export function themeHelp(name) {
  return getTheme(name).help ?? "";
}

/**
 * Whether `name` is a known theme id.
 * @param {string} name
 * @returns {boolean}
 */
export function isThemeName(name) {
  return Object.prototype.hasOwnProperty.call(THEMES, name);
}
