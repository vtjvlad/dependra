/**
 * File browser list for TUI.
 */

import { readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";

const SKIP = new Set(["node_modules", ".git"]);

/**
 * @param {string} dir
 * @param {{ showHidden?: boolean, filter?: string }} [opts]
 * @returns {{ label: string, path: string, isDir: boolean }[]}
 */
export function listDirEntries(dir, opts = {}) {
  const showHidden = Boolean(opts.showHidden);
  const filter = (opts.filter ?? "").toLowerCase();
  /** @type {{ label: string, path: string, isDir: boolean }[]} */
  const entries = [];

  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return entries;
  }

  /** @type {{ name: string, isDir: boolean }[]} */
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
    items.push({ name, isDir });
  }

  items.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  for (const item of items) {
    if (filter && !item.name.toLowerCase().includes(filter)) continue;
    entries.push({
      label: item.isDir ? `${item.name}/` : item.name,
      path: join(dir, item.name),
      isDir: item.isDir,
    });
  }

  return entries;
}

/**
 * Relative display path from project root.
 * @param {string} absPath
 * @param {string} root
 * @returns {string}
 */
export function relLabel(absPath, root) {
  const rel = relative(root, absPath);
  return rel && !rel.startsWith(`..${sep}`) ? rel : basename(absPath);
}

/**
 * Create file browser widgets.
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {object} theme
 * @param {object} session
 * @param {{
 *   onSelectFile: (path: string) => void,
 *   onStatus: (msg: string) => void,
 * }} handlers
 */
export function createFileBrowser(screen, theme, session, handlers) {
  // neo-blessed is CJS; screen already created by app
  const blessed = screen.__blessed;

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
    style: {
      fg: theme.fg,
      bg: theme.bg,
      border: { fg: theme.border },
      selected: { fg: theme.selectedFg, bg: theme.selectedBg, bold: true },
      focus: { border: { fg: theme.focusBorder } },
    },
    scrollbar: {
      ch: "│",
      style: { fg: theme.dim },
    },
  });

  /** @type {{ label: string, path: string, isDir: boolean }[]} */
  let entries = [];

  function refreshHeader() {
    const filter = session.filter ? `  {${theme.dim}-fg}/ ${session.filter}{/}` : "";
    header.setContent(
      `{bold}dependra{/bold}  {${theme.dim}-fg}${session.currentDir}{/}${filter}`,
    );
  }

  function refresh() {
    entries = listDirEntries(session.currentDir, {
      showHidden: session.prefs.showHidden,
      filter: session.filter,
    });
    const parent = resolve(session.currentDir, "..");
    const items = [];
    if (session.currentDir !== session.projectRoot) {
      items.push({ label: "../", path: parent, isDir: true });
    }
    items.push(...entries);
    entries = items;
    list.setItems(entries.map((e) => e.label));
    list.select(0);
    refreshHeader();
    screen.render();
  }

  list.on("select", (_item, index) => {
    const entry = entries[index];
    if (!entry) return;
    if (entry.isDir) {
      session.currentDir = entry.path;
      session.filter = "";
      refresh();
      handlers.onStatus(entry.path);
      return;
    }
    session.selectedPath = entry.path;
    handlers.onSelectFile(entry.path);
  });

  list.key(["left", "h"], () => {
    if (session.currentDir === session.projectRoot) return;
    session.currentDir = resolve(session.currentDir, "..");
    session.filter = "";
    refresh();
  });

  list.key(["right", "l"], () => {
    const entry = entries[list.selected];
    if (entry?.isDir) {
      session.currentDir = entry.path;
      session.filter = "";
      refresh();
    }
  });

  return {
    list,
    header,
    refresh,
    getSelected() {
      return entries[list.selected] ?? null;
    },
    focus() {
      list.focus();
    },
  };
}
