/**
 * TUI entrypoint.
 * @see docs/50-tui/overview.md
 */

import { pathToFileURL } from "node:url";
import { registerBuiltins } from "../api/index.js";
import { startApp } from "./app.js";

/**
 * Launch TUI. Requires interactive TTY.
 * @param {{ cwd?: string }} [opts]
 * @returns {Promise<number>}
 */
export async function runTui(opts = {}) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    process.stderr.write("TUI requires an interactive TTY. Use CLI flags instead.\n");
    return 1;
  }
  registerBuiltins();
  return startApp(opts);
}

/**
 * Direct node entry: `node src/tui/index.js`
 */
const entry = process.argv[1];
const isMain =
  Boolean(entry) && import.meta.url === pathToFileURL(entry).href;

if (isMain) {
  const code = await runTui();
  process.exit(code);
}
