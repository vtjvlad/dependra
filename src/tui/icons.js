/**
 * File-tree icons via Devicons (npm `devicons` + Nerd Fonts `nf-dev-*` glyphs).
 *
 * Names come from the `devicons` codepoints catalog. Glyphs prefer
 * `@m234/nerd-fonts` `nf-dev-*` so they render in terminals with a Nerd Font;
 * otherwise fall back to the raw Devicons PUA codepoint.
 */

import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { codepointsPath } from "devicons";
import { icons as nerdIcons, fromPath as nerdFromPath } from "@m234/nerd-fonts";

/** @type {Record<string, number>|null} */
let codepointsCache = null;

/**
 * @returns {Record<string, number>}
 */
function codepoints() {
  if (!codepointsCache) {
    codepointsCache = JSON.parse(readFileSync(codepointsPath(), "utf8"));
  }
  return codepointsCache;
}

/**
 * Resolve a Devicons icon name to a terminal glyph.
 * @param {string} name
 * @returns {string|null}
 */
export function glyphForDevicon(name) {
  if (!name) return null;
  const variants = [
    `nf-dev-${name}`,
    `nf-dev-${name.replace(/-/g, "")}`,
    `nf-dev-${name.replace(/-/g, "_")}`,
  ];
  for (const key of variants) {
    const icon = nerdIcons[key];
    if (icon?.value) return icon.value;
  }
  const cp = codepoints()[name];
  if (typeof cp === "number") return String.fromCodePoint(cp);
  return null;
}

/**
 * Map filename / extension → Devicons catalog name.
 * @param {string} fileName
 * @returns {string|null}
 */
export function resolveDeviconName(fileName) {
  const base = basename(fileName).toLowerCase();
  const ext = extname(base);

  /** @type {Record<string, string>} */
  const byBase = {
    "package.json": "npm",
    "package-lock.json": "npm",
    "pnpm-lock.yaml": "pnpm",
    "yarn.lock": "yarn",
    dockerfile: "docker",
    "docker-compose.yml": "docker",
    "docker-compose.yaml": "docker",
    "compose.yml": "docker",
    "compose.yaml": "docker",
    makefile: "gnu",
    "cmakelists.txt": "cmake",
    ".gitignore": "git",
    ".gitattributes": "git",
    ".gitmodules": "git",
    ".editorconfig": "editorconfig",
    ".eslintrc": "eslint",
    ".eslintrc.js": "eslint",
    ".eslintrc.cjs": "eslint",
    ".eslintrc.json": "eslint",
    "eslint.config.js": "eslint",
    ".prettierrc": "prettier",
    ".prettierrc.js": "prettier",
    ".prettierrc.json": "prettier",
    "tsconfig.json": "typescript",
    "jsconfig.json": "javascript",
    "babel.config.js": "babel",
    ".babelrc": "babel",
    "webpack.config.js": "webpack",
    "vite.config.js": "vite",
    "vite.config.ts": "vite",
    "rollup.config.js": "rollupjs",
    "gulpfile.js": "gulp",
    "gruntfile.js": "grunt",
    "readme.md": "markdown",
    readme: "markdown",
    license: "github",
    "license.md": "github",
    ".env": "env",
    ".env.local": "env",
    ".env.example": "env",
    procfile: "heroku",
  };
  if (byBase[base]) return byBase[base];

  /** @type {Record<string, string>} */
  const byExt = {
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".jsx": "react",
    ".ts": "typescript",
    ".tsx": "react",
    ".json": "json",
    ".md": "markdown",
    ".markdown": "markdown",
    ".css": "css-3",
    ".scss": "sass",
    ".sass": "sass",
    ".less": "less",
    ".html": "html-5",
    ".htm": "html-5",
    ".svg": "svg",
    ".py": "python",
    ".rb": "ruby",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".php": "php",
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "bash",
    ".yml": "yaml",
    ".yaml": "yaml",
    ".toml": "toml",
    ".xml": "xml",
    ".sql": "mysql",
    ".vue": "vue",
    ".svelte": "svelte",
    ".dockerfile": "docker",
    ".graphql": "graphql",
    ".gql": "graphql",
    ".wasm": "webassembly",
    ".lock": "npm",
  };
  if (byExt[ext]) return byExt[ext];
  return null;
}

/**
 * @param {string} name
 * @param {boolean} isDir
 * @param {boolean} [expanded]
 * @returns {string}
 */
export function entryIcon(name, isDir, expanded = false) {
  if (isDir) {
    const open = nerdIcons["nf-md-folder_open"]?.value;
    const closed =
      nerdIcons["nf-seti-folder"]?.value ?? nerdIcons["nf-md-folder"]?.value;
    if (expanded && open) return open;
    if (closed) return closed;
    return expanded ? "📂" : "📁";
  }

  const diName = resolveDeviconName(name);
  if (diName) {
    const glyph = glyphForDevicon(diName);
    if (glyph) return glyph;
    const alt = diName.endsWith("-icon") ? diName.slice(0, -5) : `${diName}-icon`;
    const g2 = glyphForDevicon(alt);
    if (g2) return g2;
  }

  try {
    const seti = nerdFromPath(name, "seti");
    if (seti?.value) return seti.value;
  } catch {
    // ignore
  }

  return nerdIcons["nf-seti-text"]?.value ?? "?";
}

/**
 * Expand / collapse marker for directories.
 * @param {boolean} isDir
 * @param {boolean} expanded
 * @returns {string}
 */
export function twisty(isDir, expanded) {
  if (!isDir) return " ";
  return expanded ? "▾" : "▸";
}
