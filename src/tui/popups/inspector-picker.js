/**
 * Inspector / operation multi-select popup.
 */

/**
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {object} theme
 * @param {import('../bridge.js').listOperations extends Function ? ReturnType<import('../bridge.js').listOperations> : never} operations
 * @param {{
 *   onRun: (keys: string[], applyMutate: boolean) => void,
 *   onCancel: () => void,
 * }} handlers
 */
export function openInspectorPicker(screen, theme, operations, handlers) {
  const blessed = screen.__blessed;

  /** @type {Set<string>} */
  const selected = new Set(["basic", "imports", "exports", "graph"]);
  let applyMutate = false;

  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "70%",
    height: "80%",
    border: { type: "line" },
    label: " Operations ",
    tags: true,
    style: {
      fg: theme.fg,
      bg: theme.popupBg,
      border: { fg: theme.focusBorder },
      label: { fg: theme.header },
    },
    shadow: true,
  });

  const help = blessed.box({
    parent: box,
    top: 0,
    left: 1,
    right: 1,
    height: 2,
    tags: true,
    content: `{${theme.dim}-fg}Space toggle · a all S01 · c clear · A apply-mutate · r/Enter run · Esc cancel{/}`,
  });

  const list = blessed.list({
    parent: box,
    top: 2,
    left: 1,
    right: 1,
    bottom: 1,
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

  function rowLabel(op) {
    const mark = selected.has(op.key) ? `{${theme.accent}-fg}[x]{/}` : "[ ]";
    const group = `{${theme.dim}-fg}${op.group}{/}`;
    return `${mark} ${op.label}  ${group}`;
  }

  function refreshList() {
    list.setItems(operations.map(rowLabel));
    screen.render();
  }

  function toggle() {
    const op = operations[list.selected];
    if (!op) return;
    if (selected.has(op.key)) selected.delete(op.key);
    else selected.add(op.key);
    refreshList();
  }

  list.key(["space"], toggle);

  list.key(["a"], () => {
    for (const k of ["basic", "imports", "exports", "graph"]) selected.add(k);
    refreshList();
  });

  list.key(["c"], () => {
    selected.clear();
    refreshList();
  });

  list.key(["A"], () => {
    applyMutate = !applyMutate;
    help.setContent(
      `{${theme.dim}-fg}Space toggle · a S01 · c clear · A apply={${applyMutate ? theme.accent : theme.dim}-fg}${applyMutate}{/} · r run · Esc{/}`,
    );
    screen.render();
  });

  function run() {
    cleanup();
    handlers.onRun([...selected], applyMutate);
  }

  list.key(["r", "enter"], run);

  function cleanup() {
    list.detach();
    help.detach();
    box.detach();
    screen.render();
  }

  function cancel() {
    cleanup();
    handlers.onCancel();
  }

  box.key(["escape"], cancel);
  list.key(["escape"], cancel);

  refreshList();
  list.focus();
  screen.render();

  return { cleanup, cancel };
}
