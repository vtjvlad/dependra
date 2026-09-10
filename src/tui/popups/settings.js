/**
 * Settings popup: TUI prefs + dependra.conf configurator.
 */

import { listThemeNames } from "../theme.js";
import { saveTuiPrefs } from "../state/session.js";
import { join } from "node:path";
import {
  OPERATION_KEYS,
  resolveUserConfPath,
  saveConf,
} from "../bridge.js";

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
    width: "80%",
    height: "85%",
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
    bottom: 2,
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    style: {
      fg: theme.fg,
      bg: theme.popupBg,
      selected: { fg: theme.selectedFg, bg: theme.selectedBg },
    },
  });

  const footer = blessed.box({
    parent: box,
    bottom: 0,
    left: 1,
    right: 1,
    height: 1,
    tags: true,
    content: `{${theme.dim}-fg}Tab switch · Space/Enter edit · w save · Esc close{/}`,
  });

  /** @type {{ id: string, label: string, get: () => string, cycle?: () => void, toggle?: () => void }[]} */
  let rows = [];

  function refreshTabBar() {
    const t0 = tab === 0 ? `{bold}{${theme.accent}-fg}[TUI]{/}` : " TUI ";
    const t1 = tab === 1 ? `{bold}{${theme.accent}-fg}[Config]{/}` : " Config ";
    tabBar.setContent(`${t0}  ${t1}`);
  }

  function buildTuiRows() {
    const themes = listThemeNames();
    rows = [
      {
        id: "theme",
        label: "theme",
        get: () => prefs.theme,
        cycle() {
          const i = themes.indexOf(prefs.theme);
          prefs.theme = themes[(i + 1) % themes.length];
        },
      },
      {
        id: "showHidden",
        label: "showHidden",
        get: () => String(prefs.showHidden),
        toggle() {
          prefs.showHidden = !prefs.showHidden;
        },
      },
      {
        id: "showKeyHints",
        label: "showKeyHints",
        get: () => String(prefs.showKeyHints),
        toggle() {
          prefs.showKeyHints = !prefs.showKeyHints;
        },
      },
    ];
  }

  function buildConfigRows() {
    rows = [
      {
        id: "confTarget",
        label: "save target",
        get: () => confTargets[confTargetIdx].label,
        cycle() {
          confTargetIdx = (confTargetIdx + 1) % confTargets.length;
        },
      },
      {
        id: "pathMode",
        label: "pathMode",
        get: () => String(model.pathMode ?? "relative"),
        cycle() {
          const modes = ["name", "relative", "absolute"];
          const i = modes.indexOf(model.pathMode);
          model.pathMode = modes[(i + 1) % modes.length];
        },
      },
      {
        id: "output",
        label: "output",
        get: () => String(model.output ?? "text"),
        cycle() {
          model.output = model.output === "json" ? "text" : "json";
          model.report.format = model.output;
        },
      },
      {
        id: "strict",
        label: "strict",
        get: () => String(Boolean(model.strict)),
        toggle() {
          model.strict = !model.strict;
        },
      },
      {
        id: "whenNoFlags",
        label: "defaults.whenNoFlags",
        get: () => String(model.defaults?.whenNoFlags ?? "s01-all"),
        cycle() {
          const vals = ["s01-all", "none"];
          const cur = model.defaults.whenNoFlags ?? "s01-all";
          model.defaults.whenNoFlags = vals[(vals.indexOf(cur) + 1) % vals.length];
        },
      },
      {
        id: "report.style",
        label: "report.style",
        get: () => String(model.report?.style ?? "schematic"),
        cycle() {
          model.report.style =
            model.report.style === "plain" ? "schematic" : "plain";
        },
      },
      {
        id: "report.color",
        label: "report.color",
        get: () => String(model.report?.color ?? "auto"),
        cycle() {
          const vals = ["auto", "always", "never"];
          const cur = model.report.color ?? "auto";
          model.report.color = vals[(vals.indexOf(cur) + 1) % vals.length];
        },
      },
      {
        id: "report.banner",
        label: "report.banner",
        get: () => String(model.report?.banner !== false),
        toggle() {
          model.report.banner = model.report.banner === false;
        },
      },
      {
        id: "report.unicode",
        label: "report.unicode",
        get: () => String(model.report?.unicode !== false),
        toggle() {
          model.report.unicode = model.report.unicode === false;
        },
      },
      {
        id: "report.verbosity",
        label: "report.verbosity",
        get: () => String(model.report?.verbosity ?? "normal"),
        cycle() {
          const vals = ["quiet", "normal", "verbose"];
          const cur = model.report.verbosity ?? "normal";
          model.report.verbosity = vals[(vals.indexOf(cur) + 1) % vals.length];
        },
      },
      {
        id: "ai.enabled",
        label: "ai.enabled",
        get: () => String(Boolean(model.ai?.enabled)),
        toggle() {
          model.ai.enabled = !model.ai.enabled;
        },
      },
      {
        id: "ai.explain",
        label: "ai.explain",
        get: () => String(Boolean(model.ai?.explain)),
        toggle() {
          model.ai.explain = !model.ai.explain;
        },
      },
      {
        id: "ai.provider",
        label: "ai.provider",
        get: () => String(model.ai?.provider ?? "openai"),
        cycle() {
          const vals = ["openai", "mock"];
          const cur = model.ai.provider ?? "openai";
          model.ai.provider = vals[(vals.indexOf(cur) + 1) % vals.length];
        },
      },
    ];

    for (const key of OPERATION_KEYS) {
      rows.push({
        id: `op.${key}`,
        label: `operations.${key}`,
        get: () => String(Boolean(model.operations?.[key])),
        toggle() {
          model.operations[key] = !model.operations[key];
        },
      });
    }
  }

  function refreshBody() {
    if (tab === 0) buildTuiRows();
    else buildConfigRows();
    body.setItems(rows.map((r) => `${r.label.padEnd(28)} ${r.get()}`));
    refreshTabBar();
    screen.render();
  }

  function editCurrent() {
    const row = rows[body.selected];
    if (!row) return;
    if (row.toggle) row.toggle();
    else if (row.cycle) row.cycle();
    refreshBody();
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
  box.key(["escape"], close);
  box.key(["tab"], () => {
    tab = tab === 0 ? 1 : 0;
    refreshBody();
  });

  refreshBody();
  body.focus();
  screen.render();

  return { cleanup, close };
}
