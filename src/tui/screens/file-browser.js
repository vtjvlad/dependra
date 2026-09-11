/**
 * Expandable project file tree for TUI.
 */

import { readdirSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { wireListMouse } from "../mouse.js";
import { entryIcon, twisty } from "../icons.js";

const SKIP = new Set(["node_modules", ".git", ".trash"]);

/**
 * @typedef {object} TreeNode
 * @property {string} name
 * @property {string} path
 * @property {boolean} isDir
 * @property {number} depth
 * @property {boolean} expanded
 * @property {boolean} isLast
 * @property {boolean[]} ancestorsLast
 */

/**
 * @param {string} dir
 * @param {{ showHidden?: boolean }} [opts]
 * @returns {{ name: string, path: string, isDir: boolean }[]}
 */
export function listChildren(dir, opts = {}) {
  const showHidden = Boolean(opts.showHidden);
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }

  /** @type {{ name: string, path: string, isDir: boolean }[]} */
  const items = [];
  for (const name of names) {
    if (SKIP.has(name)) continue;
    if (!showHidden && name.startsWith(".")) continue;
    const full = join(dir, name);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    items.push({ name, path: full, isDir });
  }

  items.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return items;
}

/**
 * Flatten tree according to expanded set.
 * @param {string} root
 * @param {Set<string>} expanded
 * @param {{ showHidden?: boolean, filter?: string }} [opts]
 * @returns {TreeNode[]}
 */
export function buildVisibleTree(root, expanded, opts = {}) {
  const filter = (opts.filter ?? "").toLowerCase();
  /** @type {TreeNode[]} */
  const rows = [];

  /**
   * @param {string} dir
   * @param {number} depth
   * @param {boolean[]} ancestorsLast
   */
  function walk(dir, depth, ancestorsLast) {
    const children = listChildren(dir, opts);
    const filtered = filter
      ? children.filter((c) => {
          if (c.name.toLowerCase().includes(filter)) return true;
          if (c.isDir && dirHasMatch(c.path, filter, opts)) return true;
          return false;
        })
      : children;

    for (let i = 0; i < filtered.length; i += 1) {
      const child = filtered[i];
      const isLast = i === filtered.length - 1;
      const isExpanded =
        child.isDir && (expanded.has(child.path) || Boolean(filter));
      rows.push({
        name: child.name,
        path: child.path,
        isDir: child.isDir,
        depth,
        expanded: isExpanded,
        isLast,
        ancestorsLast: [...ancestorsLast],
      });
      if (child.isDir && isExpanded) {
        walk(child.path, depth + 1, [...ancestorsLast, isLast]);
      }
    }
  }

  // Root row
  rows.push({
    name: basename(root) || root,
    path: root,
    isDir: true,
    depth: 0,
    expanded: true,
    isLast: true,
    ancestorsLast: [],
  });
  expanded.add(root);
  walk(root, 1, []);

  return rows;
}

/**
 * @param {string} dir
 * @param {string} filter
 * @param {{ showHidden?: boolean }} opts
 * @returns {boolean}
 */
function dirHasMatch(dir, filter, opts) {
  const children = listChildren(dir, opts);
  for (const c of children) {
    if (c.name.toLowerCase().includes(filter)) return true;
    if (c.isDir && dirHasMatch(c.path, filter, opts)) return true;
  }
  return false;
}

/**
 * Format one tree row with guides + icons.
 * @param {TreeNode} node
 * @param {object} theme
 * @returns {string}
 */
export function formatTreeLabel(node, theme) {
  let prefix = "";
  for (let i = 0; i < node.ancestorsLast.length; i += 1) {
    prefix += node.ancestorsLast[i] ? "   " : "│  ";
  }
  if (node.depth > 0) {
    prefix += node.isLast ? "└─ " : "├─ ";
  }

  const tw = twisty(node.isDir, node.expanded);
  const icon = entryIcon(node.name, node.isDir, node.expanded);
  const name = node.isDir
    ? `{${theme.header}-fg}{bold}${node.name}{/}`
    : node.name;

  if (node.depth === 0) {
    return `${tw} ${icon} {${theme.accent}-fg}{bold}${node.name}{/}`;
  }
  return `${prefix}${tw} ${icon} ${name}`;
}

/**
 * Create file tree browser widgets.
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {object} theme
 * @param {object} session
 * @param {{
 *   onSelectFile: (path: string) => void,
 *   onStatus: (msg: string) => void,
 * }} handlers
 */
export function createFileBrowser(screen, theme, session, handlers) {
  const blessed = screen.__blessed;

  /** @type {Set<string>} */
  const expanded = new Set([session.projectRoot]);

  const header = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    style: { fg: theme.header, bg: theme.bg },
  });

  const list = blessed.list({
    parent: screen,
    top: 1,
    left: 0,
    width: "100%",
    height: "100%-3",
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    border: { type: "line" },
    label: " project tree ",
    style: {
      fg: theme.fg,
      bg: theme.bg,
      border: { fg: theme.border },
      label: { fg: theme.dim },
      selected: { fg: theme.selectedFg, bg: theme.selectedBg, bold: true },
      focus: { border: { fg: theme.focusBorder } },
    },
    scrollbar: {
      ch: "│",
      track: { bg: theme.bg },
      style: { fg: theme.dim, bg: theme.bg },
    },
  });

  wireListMouse(list, screen);

  /** @type {TreeNode[]} */
  let rows = [];

  function refreshHeader() {
    const filter = session.filter ? `  {${theme.dim}-fg}/ ${session.filter}{/}` : "";
    const rel = relative(session.projectRoot, session.currentDir) || ".";
    header.setContent(
      `{bold}dependra{/bold}  {${theme.dim}-fg}tree{/}  {${theme.accent}-fg}${basename(session.projectRoot)}{/}${filter}  {${theme.dim}-fg}· ${rel}{/}`,
    );
  }

  function refresh(keepPath) {
    const prevPath = keepPath ?? rows[list.selected]?.path;
    rows = buildVisibleTree(session.projectRoot, expanded, {
      showHidden: session.prefs.showHidden,
      filter: session.filter,
    });
    list.setItems(rows.map((r) => formatTreeLabel(r, theme)));
    let idx = 0;
    if (prevPath) {
      const found = rows.findIndex((r) => r.path === prevPath);
      if (found >= 0) idx = found;
    }
    list.select(idx);
    refreshHeader();
    screen.render();
  }

  function toggleDir(node) {
    if (!node?.isDir) return;
    if (node.path === session.projectRoot) {
      // root stays expanded
      expanded.add(node.path);
      return;
    }
    if (expanded.has(node.path)) expanded.delete(node.path);
    else expanded.add(node.path);
    session.currentDir = node.path;
    refresh(node.path);
    handlers.onStatus(node.path);
  }

  function activate() {
    const node = rows[list.selected];
    if (!node) return;
    if (node.isDir) {
      toggleDir(node);
      return;
    }
    session.selectedPath = node.path;
    session.currentDir = node.path;
    handlers.onSelectFile(node.path);
  }

  list.on("select", () => {
    // Enter / click — blessed fires select on enter
    activate();
  });

  // Space toggles dirs without opening files
  list.key(["space"], () => {
    const node = rows[list.selected];
    if (node?.isDir) toggleDir(node);
    else activate();
  });

  list.key(["right", "l"], () => {
    const node = rows[list.selected];
    if (!node) return;
    if (node.isDir && !expanded.has(node.path)) {
      expanded.add(node.path);
      session.currentDir = node.path;
      refresh(node.path);
      handlers.onStatus(node.path);
      return;
    }
    // move into first child if expanded
    if (node.isDir && expanded.has(node.path)) {
      const next = rows[list.selected + 1];
      if (next && next.depth > node.depth) {
        list.select(list.selected + 1);
        screen.render();
      }
    }
  });

  list.key(["left", "h"], () => {
    const node = rows[list.selected];
    if (!node) return;
    if (node.isDir && expanded.has(node.path) && node.path !== session.projectRoot) {
      expanded.delete(node.path);
      refresh(node.path);
      return;
    }
    // jump to parent row
    if (node.depth === 0) return;
    for (let i = list.selected - 1; i >= 0; i -= 1) {
      if (rows[i].depth < node.depth) {
        list.select(i);
        session.currentDir = rows[i].path;
        screen.render();
        return;
      }
    }
  });

  return {
    list,
    header,
    refresh: () => refresh(),
    /**
     * @param {object} nextTheme
     */
    applyTheme(nextTheme) {
      theme = nextTheme;
      header.style.fg = theme.header;
      header.style.bg = theme.bg;
      list.style.fg = theme.fg;
      list.style.bg = theme.bg;
      list.style.border = { fg: theme.border };
      list.style.label = { fg: theme.dim };
      list.style.selected = {
        fg: theme.selectedFg,
        bg: theme.selectedBg,
        bold: true,
      };
      list.style.focus = { border: { fg: theme.focusBorder } };
      if (list.scrollbar) {
        list.scrollbar.style = { fg: theme.dim, bg: theme.bg };
        list.scrollbar.track = { bg: theme.bg };
      }
      refresh();
    },
    getSelected() {
      const node = rows[list.selected];
      if (!node) return null;
      return { label: node.name, path: node.path, isDir: node.isDir };
    },
    focus() {
      list.focus();
    },
  };
}
