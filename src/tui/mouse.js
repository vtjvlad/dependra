/**
 * Mouse / wheel helpers for neo-blessed widgets.
 *
 * Strategy:
 * 1. Force mouse tracking CSI on the TTY (SGR + button/all-motion).
 * 2. Listen on program.on('mouse') — fires even when child list-items steal
 *    element-level events from blessed's hit-test.
 * 3. Wheel always scrolls the focused scrollable (list/box); fallback to
 *    hit-test under the cursor.
 */

const MOUSE_CSI_ENABLE =
  "\x1b[?1000h" + // vt200 / button tracking
  "\x1b[?1002h" + // cell motion
  "\x1b[?1003h" + // all motion
  "\x1b[?1005h" + // utf-8 mouse
  "\x1b[?1006h"; // SGR mouse (modern terminals)

const MOUSE_CSI_DISABLE =
  "\x1b[?1006l\x1b[?1005l\x1b[?1003l\x1b[?1002l\x1b[?1000l";

/**
 * @param {NodeJS.WriteStream} stream
 */
function writeRaw(stream, text) {
  try {
    if (stream && typeof stream.write === "function") {
      stream.write(text);
    }
  } catch {
    // ignore
  }
}

/**
 * Enable terminal mouse protocol (click, wheel, swipe, hover motion).
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {{ onMouse?: (data: object) => void }} [hooks]
 */
export function enableScreenMouse(screen, hooks = {}) {
  const program = screen.program;

  if (typeof screen.enableMouse === "function") {
    screen.enableMouse();
  }

  if (program && typeof program.bindMouse === "function") {
    program.bindMouse();
  }

  if (program && typeof program.setMouse === "function") {
    program.setMouse(
      {
        vt200Mouse: true,
        sgrMouse: true,
        utfMouse: true,
        urxvtMouse: true,
        cellMotion: true,
        allMotion: true,
      },
      true,
    );
  }

  if (program && typeof program.flush === "function") {
    program.flush();
  }

  // Belt-and-suspenders: write CSI directly (buffered setMode can race alt-screen).
  writeRaw(program?.output ?? process.stdout, MOUSE_CSI_ENABLE);
  // Re-assert after first paint — some terminals drop modes set too early.
  setTimeout(() => {
    if (screen.destroyed) return;
    if (program && typeof program.setMouse === "function") {
      program.setMouse(
        {
          vt200Mouse: true,
          sgrMouse: true,
          utfMouse: true,
          cellMotion: true,
          allMotion: true,
        },
        true,
      );
      if (typeof program.flush === "function") program.flush();
    }
    writeRaw(program?.output ?? process.stdout, MOUSE_CSI_ENABLE);
  }, 50);

  if (screen.__dependraMouseWired) return;
  screen.__dependraMouseWired = true;

  let lastWheelAt = 0;

  const onMouse = (data) => {
    if (!data || screen.destroyed) return;
    if (typeof hooks.onMouse === "function") hooks.onMouse(data);

    if (data.action === "wheelup" || data.action === "wheeldown") {
      const now = Date.now();
      if (now - lastWheelAt < 40) return; // dedupe blessed + SGR fallback
      lastWheelAt = now;
      handleWheel(screen, data);
      return;
    }

    if (data.action === "mousemove") {
      const list = resolveListUnderCursor(screen, data) ??
        (screen.focused?.type === "list" ? screen.focused : null);
      if (list) hoverSelectAt(list, data, screen);
    }
  };

  // Prefer program-level (always gets decoded mouse); also keep screen-level.
  if (program && typeof program.on === "function") {
    program.on("mouse", onMouse);
  }
  screen.on("mouse", onMouse);

  // Raw SGR fallback: some hosts deliver mouse sequences that blessed misses.
  installSgrFallback(program?.input ?? process.stdin, (data) => {
    onMouse(data);
  });

  screen.on("destroy", () => {
    writeRaw(program?.output ?? process.stdout, MOUSE_CSI_DISABLE);
  });
}

/**
 * Parse SGR mouse sequences directly from the input stream.
 * @param {NodeJS.ReadableStream} input
 * @param {(data: object) => void} emit
 */
function installSgrFallback(input, emit) {
  if (!input || typeof input.on !== "function") return;
  if (input.__dependraSgrMouse) return;
  input.__dependraSgrMouse = true;

  let buf = "";
  input.on("data", (chunk) => {
    buf += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    // Keep buffer bounded
    if (buf.length > 4096) buf = buf.slice(-2048);

    // SGR: CSI < Cb ; Cx ; Cy M/m
    const re = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g;
    let m;
    let lastIndex = 0;
    while ((m = re.exec(buf))) {
      lastIndex = re.lastIndex;
      const cb = Number(m[1]);
      const x = Number(m[2]) - 1;
      const y = Number(m[3]) - 1;
      const release = m[4] === "m";
      /** @type {object} */
      const data = { name: "mouse", type: "SGR-fallback", x, y, raw: m[0] };

      // button codes: 0 left, 1 mid, 2 right, 64 wheelup, 65 wheeldown (+32 motion)
      const btn = cb & 63;
      if (btn === 64) data.action = "wheelup";
      else if (btn === 65) data.action = "wheeldown";
      else if (cb & 32) data.action = "mousemove";
      else if (release) data.action = "mouseup";
      else data.action = "mousedown";

      emit(data);
    }
    if (lastIndex > 0) buf = buf.slice(lastIndex);

    // X10 / utf: ESC [ M Cb Cx Cy  (3 bytes after M)
    const x10 = /\x1b\[M([\s\S]{3})/g;
    while ((m = x10.exec(buf))) {
      const b = m[1].charCodeAt(0) - 32;
      const x = m[1].charCodeAt(1) - 33;
      const y = m[1].charCodeAt(2) - 33;
      /** @type {object} */
      const data = { name: "mouse", type: "X10-fallback", x, y, raw: m[0] };
      if ((b >> 6) & 1) data.action = b & 1 ? "wheeldown" : "wheelup";
      else if (b === 3) data.action = "mouseup";
      else if (b === 35) data.action = "mousemove";
      else data.action = "mousedown";
      emit(data);
    }
  });
}

/**
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {{ action: string, x?: number, y?: number }} data
 */
function handleWheel(screen, data) {
  const target =
    resolveScrollable(screen.focused) ||
    resolveScrollTarget(screen, data);
  if (!target) return;

  const step = 3;
  if (data.action === "wheeldown") {
    if (typeof target.down === "function") target.down(step);
    else if (typeof target.scroll === "function") target.scroll(step);
  } else if (typeof target.up === "function") {
    target.up(step);
  } else if (typeof target.scroll === "function") {
    target.scroll(-step);
  }
  screen.render();
}

/**
 * @param {object|null|undefined} el
 * @returns {object|null}
 */
function resolveScrollable(el) {
  if (!el) return null;
  if (el.parent && el.parent.type === "list") return el.parent;
  if (
    typeof el.down === "function" ||
    typeof el.scroll === "function" ||
    el.scrollable
  ) {
    return el;
  }
  return null;
}

/**
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {{ x?: number, y?: number }} data
 * @returns {object|null}
 */
function resolveScrollTarget(screen, data) {
  const hit = hitClickable(screen, data);
  return resolveScrollable(hit);
}

/**
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {{ x?: number, y?: number }} data
 * @returns {object|null}
 */
function resolveListUnderCursor(screen, data) {
  const hit = hitClickable(screen, data);
  if (!hit) return null;
  if (hit.type === "list") return hit;
  if (hit.parent && hit.parent.type === "list") return hit.parent;
  return null;
}

/**
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {{ x?: number, y?: number }} data
 * @returns {object|null}
 */
function hitClickable(screen, data) {
  if (typeof data.x !== "number" || typeof data.y !== "number") return null;
  const clickable = screen.clickable ?? [];
  for (const el of clickable) {
    if (!el || el.detached || !el.visible) continue;
    const pos = el.lpos;
    if (!pos) continue;
    if (
      data.x >= pos.xi &&
      data.x < pos.xl &&
      data.y >= pos.yi &&
      data.y < pos.yl
    ) {
      return el;
    }
  }
  return null;
}

/**
 * @param {object} list
 * @param {{ y?: number }} data
 * @param {import('neo-blessed').Widgets.Screen} screen
 */
function hoverSelectAt(list, data, screen) {
  if (typeof data.y !== "number") return;
  const lpos = list.lpos;
  if (!lpos) return;
  const border = list.border ? 1 : 0;
  const row = data.y - lpos.yi - border;
  if (row < 0) return;
  const index = (list.childBase ?? 0) + row;
  const len = list.items?.length ?? 0;
  if (index < 0 || index >= len) return;
  if (list.selected === index) return;
  list.select(index);
  screen.render();
}

/**
 * Ensure widget is registered for mouse hit-testing.
 * @param {object} widget
 * @param {import('neo-blessed').Widgets.Screen} _screen
 * @param {{ step?: number }} [_opts]
 */
export function bindWheelScroll(widget, _screen, _opts = {}) {
  if (typeof widget.enableMouse === "function") {
    widget.enableMouse();
  }
}

/**
 * @param {object} list
 * @param {import('neo-blessed').Widgets.Screen} screen
 */
export function bindHoverSelect(list, screen) {
  if (typeof list.enableMouse === "function") {
    list.enableMouse();
  }
  list.on("mousemove", (data) => hoverSelectAt(list, data, screen));
  list.on("element mousemove", (_el, data) => hoverSelectAt(list, data, screen));
}

/**
 * @param {object} list
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {{ hover?: boolean, step?: number }} [opts]
 */
export function wireListMouse(list, screen, opts = {}) {
  bindWheelScroll(list, screen, { step: opts.step ?? 3 });
  if (opts.hover !== false) {
    bindHoverSelect(list, screen);
  }
}
