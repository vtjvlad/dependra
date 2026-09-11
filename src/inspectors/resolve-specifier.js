import { existsSync, statSync } from "node:fs";
import { dirname, extname, isAbsolute, join, normalize, resolve } from "node:path";
import { ensureBuiltInBackends, listExtensions } from "../parsers/index.js";

/**
 * @returns {string[]}
 */
function tryExts() {
  ensureBuiltInBackends();
  const fromRegistry = listExtensions();
  return fromRegistry.length > 0
    ? fromRegistry
    : [".js", ".mjs", ".cjs", ".ts", ".tsx"];
}

/**
 * @param {string} candidate
 * @returns {string|null}
 */
function ifFile(candidate) {
  try {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Минимальный Node-like resolve для относительных/абсолютных спецификаторов.
 * Bare → { isExternal: true, resolvedPath: null }.
 * Расширения берутся из language-backend registry (JS + TS).
 *
 * @param {string|null} specifier
 * @param {string} fromFileAbs абсолютный путь файла-импортёра
 * @returns {{ isExternal: boolean, resolvedPath: string|null }}
 */
export function resolveSpecifier(specifier, fromFileAbs) {
  if (specifier == null) {
    return { isExternal: false, resolvedPath: null };
  }

  if (specifier.startsWith("node:")) {
    return { isExternal: true, resolvedPath: null };
  }

  const isRel = specifier.startsWith("./") || specifier.startsWith("../");
  const isAbs = isAbsolute(specifier);

  if (!isRel && !isAbs) {
    return { isExternal: true, resolvedPath: null };
  }

  const baseDir = dirname(fromFileAbs);
  const raw = isAbs ? normalize(specifier) : resolve(baseDir, specifier);
  const TRY_EXTS = tryExts();

  const direct = ifFile(raw);
  if (direct) return { isExternal: false, resolvedPath: direct };

  if (!extname(raw)) {
    for (const ext of TRY_EXTS) {
      const hit = ifFile(raw + ext);
      if (hit) return { isExternal: false, resolvedPath: hit };
    }
    for (const ext of TRY_EXTS) {
      const hit = ifFile(join(raw, `index${ext}`));
      if (hit) return { isExternal: false, resolvedPath: hit };
    }
  }

  // Не найден на диске — локальный спецификатор, но путь не resolved
  return { isExternal: false, resolvedPath: null };
}
