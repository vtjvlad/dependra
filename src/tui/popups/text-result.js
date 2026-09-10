/**
 * Scrollable text result popup.
 */

/**
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {object} theme
 * @param {string} text
 * @param {{ onClose: () => void }} handlers
 */
export function openTextResult(screen, theme, text, handlers) {
  const blessed = screen.__blessed;

  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "90%",
    height: "90%",
    border: { type: "line" },
    label: " Results ",
    tags: false,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollbar: {
      ch: "│",
      style: { fg: theme.dim },
    },
    style: {
      fg: theme.fg,
      bg: theme.popupBg,
      border: { fg: theme.focusBorder },
      label: { fg: theme.header },
    },
    shadow: true,
    content: text || "(empty report)",
  });

  const hint = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    content: `{${theme.dim}-fg}j/k scroll · Esc/q close{/}`,
  });

  function cleanup() {
    hint.detach();
    box.detach();
    screen.render();
  }

  function close() {
    cleanup();
    handlers.onClose();
  }

  box.key(["escape", "q"], close);
  box.focus();
  screen.render();

  return { cleanup, close };
}
