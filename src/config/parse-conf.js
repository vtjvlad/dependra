/**
 * Парсер INI-like dependra.conf (docs/35-configuration/s05-config.md).
 */

/**
 * @typedef {object} ConfParseError
 * @property {string} message
 * @property {number} [line]
 */

/**
 * @param {string} raw
 * @returns {{ ok: true, data: object } | { ok: false, error: ConfParseError }}
 */
export function parseConf(raw) {
  /** @type {object} */
  const root = {};
  /** @type {string[]} */
  let sectionPath = [];

  const lines = String(raw).split(/\r?\n/);
  for (let li = 0; li < lines.length; li += 1) {
    const lineNo = li + 1;
    let line = lines[li];
    const trimmedStart = line.trimStart();
    if (trimmedStart === "" || trimmedStart.startsWith("#")) continue;

    const sectionMatch = trimmedStart.match(/^\[([^\]]+)\]\s*(?:#.*)?$/);
    if (sectionMatch) {
      const name = sectionMatch[1].trim();
      if (!name) {
        return { ok: false, error: { message: "Пустое имя секции", line: lineNo } };
      }
      sectionPath = name.split(".").map((p) => p.trim()).filter(Boolean);
      ensurePath(root, sectionPath);
      continue;
    }

    const eq = findAssignment(line);
    if (!eq) {
      return {
        ok: false,
        error: { message: `Ожидалось key = value: ${trimmedStart}`, line: lineNo },
      };
    }

    const key = eq.key;
    const value = parseValue(eq.value);
    if (key === "apiKey" || key === "api_key" || key === "secret") {
      return {
        ok: false,
        error: {
          message: `Секреты в конфиге запрещены (${key}); используйте apiKeyEnv`,
          line: lineNo,
        },
      };
    }

    const target = sectionPath.length ? getPath(root, sectionPath) : root;
    if (target == null || typeof target !== "object") {
      return {
        ok: false,
        error: { message: `Некорректная секция для ключа ${key}`, line: lineNo },
      };
    }
    target[key] = value;
  }

  return { ok: true, data: root };
}

/**
 * @param {string} line
 * @returns {{ key: string, value: string }|null}
 */
function findAssignment(line) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "#" && !inSingle && !inDouble) {
      line = line.slice(0, i);
      break;
    }
  }
  const eqIdx = line.indexOf("=");
  if (eqIdx < 0) return null;
  const key = line.slice(0, eqIdx).trim();
  const value = line.slice(eqIdx + 1).trim();
  if (!key) return null;
  return { key, value };
}

/**
 * @param {string} raw
 * @returns {unknown}
 */
function parseValue(raw) {
  if (raw === "" || raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+$/.test(raw)) return Number(raw);

  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }

  if (raw.includes(",")) {
    return raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  }

  return raw;
}

/**
 * @param {object} obj
 * @param {string[]} path
 */
function ensurePath(obj, path) {
  let cur = obj;
  for (const part of path) {
    if (cur[part] == null || typeof cur[part] !== "object" || Array.isArray(cur[part])) {
      cur[part] = {};
    }
    cur = cur[part];
  }
}

/**
 * @param {object} obj
 * @param {string[]} path
 * @returns {object|null}
 */
function getPath(obj, path) {
  let cur = obj;
  for (const part of path) {
    if (cur == null || typeof cur !== "object") return null;
    cur = cur[part];
  }
  return cur && typeof cur === "object" ? cur : null;
}
