/**
 * Settings popup: TUI prefs + dependra.conf configurator (grouped + help).
 */

import { listThemeNames, themeLabel, themeHelp } from "../theme.js";
import { saveTuiPrefs } from "../state/session.js";
import { join } from "node:path";
import { wireListMouse } from "../mouse.js";
import {
  resolveUserConfPath,
  saveConf,
} from "../bridge.js";
import { configSections, tuiSections } from "./config-schema.js";

  /**
   * @typedef {object} Row
   * @property {"section"|"field"} type
   * @property {string} id
   * @property {string} label
   * @property {string} help
   * @property {() => string} [get]
   * @property {() => void} [cycle]
   * @property {() => void} [toggle]
   * @property {() => string} [helpFn]
   */

/**
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {object} theme
 * @param {object} session
 * @param {{
 *   onSaved: () => void,
 *   onClose: () => void,
 * }} handlers
 */
export function openSettings(screen, theme, session, handlers) {
  const blessed = screen.__blessed;

  let tab = 0; // 0 = TUI, 1 = Config
  const prefs = { ...session.prefs };
  const model = structuredClone(session.confModel ?? {});
  if (!model.operations) model.operations = {};
  if (!model.report) model.report = {};
  if (!model.defaults) model.defaults = {};
  if (!model.ai) model.ai = {};

  const confTargets = [
    {
      id: "project",
      label: "project conf",
      path: session.confPath || join(session.projectRoot, "dependra.conf"),
    },
    { id: "user", label: "user conf", path: resolveUserConfPath() },
  ];
  let confTargetIdx = 0;

  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "88%",
    height: "90%",
    border: { type: "line" },
    label: " Settings ",
    tags: true,
    style: {
      fg: theme.fg,
      bg: theme.popupBg,
      border: { fg: theme.focusBorder },
      label: { fg: theme.header },
    },
    shadow: true,
  });

  const tabBar = blessed.box({
    parent: box,
    top: 0,
    left: 1,
    right: 1,
    height: 1,
    tags: true,
  });

  const body = blessed.list({
    parent: box,
    top: 2,
    left: 1,
    right: 1,
    bottom: 3,
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    scrollbar: {
      ch: "│",
      style: { fg: theme.dim },
    },
    style: {
      fg: theme.fg,
      bg: theme.popupBg,
      selected: { fg: theme.selectedFg, bg: theme.selectedBg },
    },
  });

  wireListMouse(body, screen);

  const helpBox = blessed.box({
    parent: box,
    bottom: 1,
    left: 1,
    right: 1,
    height: 1,
    tags: true,
    style: { fg: theme.dim, bg: theme.popupBg },
  });

  const footer = blessed.box({
    parent: box,
    bottom: 0,
    left: 1,
    right: 1,
    height: 1,
    tags: true,
    content: `{${theme.dim}-fg}Tab · j/k · Space/Enter edit · w save · Esc{/}`,
  });

  /** @type {Row[]} */
  let rows = [];

  function refreshTabBar() {
    const t0 = tab === 0 ? `{bold}{${theme.accent}-fg}[TUI]{/}` : " TUI ";
    const t1 = tab === 1 ? `{bold}{${theme.accent}-fg}[Config]{/}` : " Config ";
    tabBar.setContent(`${t0}  ${t1}  {${theme.dim}-fg}блоки · описания внизу{/}`);
  }

  /**
   * @param {string} id
   * @returns {{ get: () => string, cycle?: () => void, toggle?: () => void }}
   */
  function fieldBinding(id) {
    /** @type {Record<string, { get: () => string, cycle?: () => void, toggle?: () => void, help?: () => string }>} */
    const map = {
      theme: {
        get: () => {
          const tid = prefs.theme;
          return `${themeLabel(tid)} (${tid})`;
        },
        cycle() {
          const themes = listThemeNames();
          const i = themes.indexOf(prefs.theme);
          prefs.theme = themes[(i + 1) % themes.length];
        },
        help() {
          return themeHelp(prefs.theme);
        },
      },
      showHidden: {
        get: () => String(prefs.showHidden),
        toggle() {
          prefs.showHidden = !prefs.showHidden;
        },
      },
      showKeyHints: {
        get: () => String(prefs.showKeyHints),
        toggle() {
          prefs.showKeyHints = !prefs.showKeyHints;
        },
      },
      confTarget: {
        get: () => confTargets[confTargetIdx].label,
        cycle() {
          confTargetIdx = (confTargetIdx + 1) % confTargets.length;
        },
      },
      pathMode: {
        get: () => String(model.pathMode ?? "relative"),
        cycle() {
          const modes = ["name", "relative", "absolute"];
          const i = modes.indexOf(model.pathMode);
          model.pathMode = modes[(i + 1) % modes.length];
        },
      },
      output: {
        get: () => String(model.output ?? "text"),
        cycle() {
          model.output = model.output === "json" ? "text" : "json";
          model.report.format = model.output;
        },
      },
      strict: {
        get: () => String(Boolean(model.strict)),
        toggle() {
          model.strict = !model.strict;
        },
      },
      whenNoFlags: {
        get: () => String(model.defaults?.whenNoFlags ?? "s01-all"),
        cycle() {
          const vals = ["s01-all", "none"];
          const cur = model.defaults.whenNoFlags ?? "s01-all";
          model.defaults.whenNoFlags =
            vals[(vals.indexOf(cur) + 1) % vals.length];
        },
      },
      "report.style": {
        get: () => String(model.report?.style ?? "schematic"),
        cycle() {
          model.report.style =
            model.report.style === "plain" ? "schematic" : "plain";
        },
      },
      "report.color": {
        get: () => String(model.report?.color ?? "auto"),
        cycle() {
          const vals = ["auto", "always", "never"];
          const cur = model.report.color ?? "auto";
          model.report.color = vals[(vals.indexOf(cur) + 1) % vals.length];
        },
      },
      "report.banner": {
        get: () => String(model.report?.banner !== false),
        toggle() {
          model.report.banner = model.report.banner === false;
        },
      },
      "report.unicode": {
        get: () => String(model.report?.unicode !== false),
        toggle() {
          model.report.unicode = model.report.unicode === false;
        },
      },
      "report.verbosity": {
        get: () => String(model.report?.verbosity ?? "normal"),
        cycle() {
          const vals = ["quiet", "normal", "verbose"];
          const cur = model.report.verbosity ?? "normal";
          model.report.verbosity = vals[(vals.indexOf(cur) + 1) % vals.length];
        },
      },
      "ai.enabled": {
        get: () => String(Boolean(model.ai?.enabled)),
        toggle() {
          model.ai.enabled = !model.ai.enabled;
        },
      },
      "ai.explain": {
        get: () => String(Boolean(model.ai?.explain)),
        toggle() {
          model.ai.explain = !model.ai.explain;
        },
      },
      "ai.provider": {
        get: () => String(model.ai?.provider ?? "openai"),
        cycle() {
          const vals = ["openai", "mock"];
          const cur = model.ai.provider ?? "openai";
          model.ai.provider = vals[(vals.indexOf(cur) + 1) % vals.length];
        },
      },
    };

    if (id.startsWith("op.")) {
      const key = id.slice(3);
      return {
        get: () => String(Boolean(model.operations?.[key])),
        toggle() {
          model.operations[key] = !model.operations[key];
        },
      };
    }

    return map[id] ?? { get: () => "" };
  }

  /**
   * @param {ReturnType<typeof tuiSections>} sections
   * @returns {Row[]}
   */
  function rowsFromSections(sections) {
    /** @type {Row[]} */
    const out = [];
    for (const section of sections) {
      out.push({
        type: "section",
        id: `sec:${section.id}`,
        label: section.title,
        help: section.help,
      });
      for (const field of section.fields) {
        const bind = fieldBinding(field.id);
        out.push({
          type: "field",
          id: field.id,
          label: field.label,
          help: field.help,
          get: bind.get,
          cycle: bind.cycle,
          toggle: bind.toggle,
          helpFn: bind.help,
        });
      }
    }
    return out;
  }

  function formatRow(row) {
    if (row.type === "section") {
      return `{${theme.header}-fg}{bold}── ${row.label} ──{/}  {${theme.dim}-fg}${row.help}{/}`;
    }
    const value = row.get ? row.get() : "";
    const help = row.helpFn ? row.helpFn() : row.help;
    const name = `  ${row.label}`;
    return `${name.padEnd(22)} {${theme.accent}-fg}${value}{/}  {${theme.dim}-fg}${help}{/}`;
  }

  function updateHelp() {
    const row = rows[body.selected];
    if (!row) {
      helpBox.setContent("");
      return;
    }
    if (row.type === "section") {
      helpBox.setContent(
        `{${theme.header}-fg}блок:{/} ${row.label}  ·  ${row.help}`,
      );
      return;
    }
    const help = row.helpFn ? row.helpFn() : row.help;
    helpBox.setContent(`{${theme.accent}-fg}${row.label}{/}  ·  ${help}`);
  }

  function refreshBody() {
    const prevId = rows[body.selected]?.id;
    rows =
      tab === 0
        ? rowsFromSections(tuiSections())
        : rowsFromSections(configSections());
    body.setItems(rows.map(formatRow));
    let idx = 0;
    if (prevId) {
      const found = rows.findIndex((r) => r.id === prevId);
      if (found >= 0) idx = found;
    }
    // Prefer first field, not section header
    if (rows[idx]?.type === "section") {
      const next = rows.findIndex((r, i) => i >= idx && r.type === "field");
      if (next >= 0) idx = next;
    }
    body.select(idx);
    refreshTabBar();
    updateHelp();
    screen.render();
  }

  function editCurrent() {
    const row = rows[body.selected];
    if (!row || row.type === "section") return;
    if (row.toggle) row.toggle();
    else if (row.cycle) row.cycle();
    else return;
    const keep = body.selected;
    body.setItems(rows.map(formatRow));
    body.select(keep);
    updateHelp();
    screen.render();
  }

  function save() {
    if (tab === 0) {
      const saved = saveTuiPrefs(prefs);
      if (!saved.ok) {
        footer.setContent(`{red-fg}save failed: ${saved.error}{/}`);
        screen.render();
        return;
      }
      session.prefs = { ...prefs };
      footer.setContent(`{${theme.accent}-fg}TUI prefs saved{/}`);
      handlers.onSaved();
      screen.render();
      return;
    }
    const target = confTargets[confTargetIdx];
    const result = saveConf(target.path, model);
    if (!result.ok) {
      footer.setContent(`{red-fg}${result.error}{/}`);
      screen.render();
      return;
    }
    session.confModel = model;
    session.confPath = target.path;
    footer.setContent(`{${theme.accent}-fg}saved ${target.path}{/}`);
    handlers.onSaved();
    screen.render();
  }

  function cleanup() {
    body.detach();
    tabBar.detach();
    helpBox.detach();
    footer.detach();
    box.detach();
    screen.render();
  }

  function close() {
    cleanup();
    handlers.onClose();
  }

  body.key(["tab"], () => {
    tab = tab === 0 ? 1 : 0;
    refreshBody();
  });
  body.key(["space", "enter"], editCurrent);
  body.key(["w"], save);
  body.key(["escape"], close);

  body.key(["down", "j"], () => {
    setImmediate(() => {
      if (rows[body.selected]?.type === "section") {
        for (let i = body.selected + 1; i < rows.length; i += 1) {
          if (rows[i].type === "field") {
            body.select(i);
            break;
          }
        }
      }
      updateHelp();
      screen.render();
    });
  });

  body.key(["up", "k"], () => {
    setImmediate(() => {
      if (rows[body.selected]?.type === "section") {
        for (let i = body.selected - 1; i >= 0; i -= 1) {
          if (rows[i].type === "field") {
            body.select(i);
            break;
          }
        }
      }
      updateHelp();
      screen.render();
    });
  });

  box.key(["escape"], close);
  box.key(["tab"], () => {
    tab = tab === 0 ? 1 : 0;
    refreshBody();
  });

  // Mouse hover / click selection → refresh help line
  body.on("mousemove", () => {
    setImmediate(() => {
      updateHelp();
      screen.render();
    });
  });

  refreshBody();
  body.focus();
  screen.render();

  return { cleanup, close };
}
