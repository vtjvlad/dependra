import { accessSync, constants } from "node:fs";
import { delimiter, join } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * @param {string} name
 * @param {string} [pathEnv]
 * @returns {string|null} absolute path to executable or null
 */
export function resolveOnPath(name, pathEnv = process.env.PATH ?? "") {
  if (!name || !pathEnv) return null;
  const dirs = pathEnv.split(delimiter).filter(Boolean);
  for (const dir of dirs) {
    const candidate = join(dir, name);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * @param {string} name
 * @param {{ timeoutMs?: number, pathEnv?: string }} [opts]
 * @returns {{ available: boolean, version: string|null, path: string|null }}
 */
export function probeVersion(name, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 2000;
  const pathEnv = opts.pathEnv ?? process.env.PATH ?? "";
  const resolved = resolveOnPath(name, pathEnv);
  if (!resolved) {
    return { available: false, version: null, path: null };
  }

  let version = null;
  for (const flag of ["--version", "-v", "-V"]) {
    try {
      const r = spawnSync(resolved, [flag], {
        encoding: "utf8",
        timeout: timeoutMs,
        env: process.env,
      });
      const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
      if (out) {
        version = out.split(/\r?\n/)[0].trim() || null;
        break;
      }
    } catch {
      /* try next flag */
    }
  }

  return { available: true, version, path: resolved };
}

/**
 * Read shebang interpreter token from first line (e.g. node, python3, bash).
 *
 * @param {string} sourceText
 * @returns {{ shebang: string|null, interpreter: string|null }}
 */
export function parseShebang(sourceText) {
  if (!sourceText.startsWith("#!")) {
    return { shebang: null, interpreter: null };
  }
  const first = sourceText.split(/\r?\n/, 1)[0] ?? "";
  const shebang = first.trim();
  const parts = shebang.slice(2).trim().split(/\s+/);
  if (parts.length === 0) return { shebang, interpreter: null };
  if (parts[0].endsWith("/env") && parts[1]) {
    return { shebang, interpreter: parts[1] };
  }
  const base = parts[0].split("/").pop() ?? null;
  return { shebang, interpreter: base };
}
