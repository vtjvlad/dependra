/**
 * TUI application root: layout, global keys, popup orchestration.
 */

import { createRequire } from "node:module";
import { getTheme } from "./theme.js";
import { enableScreenMouse } from "./mouse.js";
import { createFileBrowser } from "./screens/file-browser.js";
import { openInspectorPicker } from "./popups/inspector-picker.js";
import { openTextResult } from "./popups/text-result.js";
import { openSettings } from "./popups/settings.js";
import { loadTuiPrefs } from "./state/session.js";
import {
  findProjectRoot,
  listOperations,
  loadSessionConfig,
  runAnalysis,
} from "./bridge.js";

const require = createRequire(import.meta.url);
const blessed = require("neo-blessed");

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {Promise<number>} exit code
 */
export async function startApp(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const projectRoot = findProjectRoot(cwd, cwd);

  const loaded = loadSessionConfig(projectRoot, cwd);
  /** @type {object} */
  const session = {
    cwd,
    projectRoot,
    currentDir: projectRoot,
    selectedPath: null,
    lastReport: null,
    lastText: null,
    filter: "",
    prefs: loadTuiPrefs(),
    confModel: loaded.ok ? loaded.model : null,
    confPath: loaded.ok ? loaded.configPath : null,
  };

  let theme = getTheme(session.prefs.theme);
  let popupOpen = false;
  /** @type {{ cleanup: () => void } | null} */
  let activePopup = null;

  const screen = blessed.screen({
    smartCSR: true,
    title: "dependra",
    fullUnicode: true,
    mouse: true,
  });
  // Share blessed constructor with child widgets
  screen.__blessed = blessed;

  const status = blessed.box({
    parent: screen,
    bottom: session.prefs.showKeyHints ? 1 : 0,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    style: { fg: theme.dim, bg: theme.bg },
  });

  const hints = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: "100%",
    height: session.prefs.showKeyHints ? 1 : 0,
    tags: true,
    style: { fg: theme.dim, bg: theme.bg },
    content: session.prefs.showKeyHints
      ? `{${theme.dim}-fg}hjkl/mouse navigate · Enter open · / filter · s settings · : cmd · q quit{/}`
      : "",
  });

  function setStatus(msg) {
    status.setContent(`{${theme.dim}-fg}${msg}{/}`);
    screen.render();
  }

  let mouseSeen = false;
  enableScreenMouse(screen, {
    onMouse(data) {
      if (mouseSeen) return;
      if (
        data.action === "wheelup" ||
        data.action === "wheeldown" ||
        data.action === "mousedown" ||
        data.action === "mousemove"
      ) {
        mouseSeen = true;
        setStatus(`mouse ok · ${data.action}`);
      }
    },
  });

  function closePopup() {
    if (activePopup) {
      activePopup.cleanup();
      activePopup = null;
    }
    popupOpen = false;
    browser.focus();
    screen.render();
  }

  const browser = createFileBrowser(screen, theme, session, {
    onSelectFile(filePath) {
      if (popupOpen) return;
      popupOpen = true;
      activePopup = openInspectorPicker(screen, theme, listOperations(), {
        async onRun(keys, applyMutate) {
          popupOpen = false;
          activePopup = null;
          setStatus(`analyzing ${filePath}…`);
          screen.render();
          try {
            const result = await runAnalysis({
              targetPath: filePath,
              cwd,
              selectedKeys: keys,
              confModel: session.confModel,
              applyMutate,
            });
            session.lastReport = result.report;
            session.lastText = result.text;
            for (const msg of result.prerequisiteErrors ?? []) {
              // surface via status briefly
              setStatus(msg);
            }
            popupOpen = true;
            activePopup = openTextResult(screen, theme, result.text, {
              onClose() {
                closePopup();
                setStatus(filePath);
              },
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            popupOpen = true;
            activePopup = openTextResult(screen, theme, `Error: ${msg}`, {
              onClose() {
                closePopup();
              },
            });
          }
        },
        onCancel() {
          closePopup();
        },
      });
    },
    onStatus: setStatus,
  });

  function openSettingsPopup() {
    if (popupOpen) return;
    popupOpen = true;
    activePopup = openSettings(screen, theme, session, {
      onSaved() {
        theme = getTheme(session.prefs.theme);
        hints.setContent(
          session.prefs.showKeyHints
            ? `{${theme.dim}-fg}hjkl/mouse navigate · Enter open · / filter · s settings · : cmd · q quit{/}`
            : "",
        );
        hints.height = session.prefs.showKeyHints ? 1 : 0;
        status.bottom = session.prefs.showKeyHints ? 1 : 0;
        browser.refresh();
      },
      onClose() {
        closePopup();
        browser.refresh();
      },
    });
  }

  function openFilter() {
    if (popupOpen) return;
    popupOpen = true;
    const input = blessed.textbox({
      parent: screen,
      bottom: session.prefs.showKeyHints ? 1 : 0,
      left: 0,
      width: "100%",
      height: 1,
      keys: true,
      inputOnFocus: true,
      style: { fg: theme.fg, bg: theme.bg },
    });
    activePopup = {
      cleanup() {
        input.detach();
      },
    };
    input.setValue(session.filter);
    input.focus();
    input.readInput((err, value) => {
      if (!err && value != null) {
        session.filter = String(value);
      }
      input.detach();
      activePopup = null;
      popupOpen = false;
      browser.refresh();
      browser.focus();
    });
    screen.render();
  }

  function openCommand() {
    if (popupOpen) return;
    popupOpen = true;
    const input = blessed.textbox({
      parent: screen,
      bottom: session.prefs.showKeyHints ? 1 : 0,
      left: 0,
      width: "100%",
      height: 1,
      keys: true,
      inputOnFocus: true,
      style: { fg: theme.fg, bg: theme.bg },
    });
    activePopup = {
      cleanup() {
        input.detach();
      },
    };
    input.setValue(":");
    input.focus();
    input.readInput((err, value) => {
      input.detach();
      activePopup = null;
      popupOpen = false;
      const cmd = String(value ?? "")
        .replace(/^:/, "")
        .trim()
        .toLowerCase();
      if (cmd === "q" || cmd === "quit") {
        screen.destroy();
        return;
      }
      if (cmd === "settings" || cmd === "s") {
        openSettingsPopup();
        return;
      }
      browser.focus();
      screen.render();
    });
    screen.render();
  }

  screen.key(["q", "C-c"], () => {
    if (popupOpen) {
      closePopup();
      return;
    }
    screen.destroy();
  });

  screen.key(["s"], () => {
    if (!popupOpen) openSettingsPopup();
  });

  screen.key(["/"], () => {
    if (!popupOpen) openFilter();
  });

  screen.key([":"], () => {
    if (!popupOpen) openCommand();
  });

  browser.refresh();
  browser.focus();
  setStatus(projectRoot);
  screen.render();

  return new Promise((resolve) => {
    screen.on("destroy", () => resolve(0));
  });
}
