/**
 * Загрузка и merge dependra.conf (docs/35-configuration/s05-config.md).
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { findProjectRoot } from "../inspectors/scan-js-files.js";
import { operationsForLevel } from "./levels.js";
import { parseConf } from "./parse-conf.js";

/** @type {string[]} */
export const OPERATION_KEYS = [
  "basic",
  "imports",
  "exports",
  "graph",
  "additional",
  "entities",
  "validate",
  "environment",
  "commands",
  "envCheck",
  "runtime",
  "io",
  "mermaid",
  "graphviz",
  "vizJson",
  "metadata",
];

/**
 * @returns {object}
 */
export function emptyConfigModel() {
  return {
    pathMode: "relative",
    output: "text",
    defaultProfile: null,
    strict: false,
    defaults: {
      whenNoFlags: "s01-all",
      mergeMode: "or",
    },
    operations: Object.fromEntries(OPERATION_KEYS.map((k) => [k, false])),
    report: {
      format: "text",
      style: "schematic",
      color: "auto",
      banner: true,
      sectionOrder: null,
      hideSections: [],
      verbosity: "normal",
      unicode: true,
      width: null,
    },
    flags: {
      aliases: {},
      rename: {},
      disable: [],
    },
    profiles: {},
    ai: {
      enabled: false,
      provider: "openai",
      baseUrl: null,
      apiKeyEnv: "DEPENDRA_AI_API_KEY",
      model: null,
      timeoutMs: 30000,
      explain: false,
    },
  };
}

/**
 * @param {string} filePath
 * @returns {{ ok: true, data: object } | { ok: false, error: string }}
 */
export function loadConfFile(filePath) {
  if (!existsSync(filePath)) {
    return { ok: false, error: `Конфиг не найден: ${filePath}` };
  }
  let text;
  try {
    text = readFileSync(filePath, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Не удалось прочитать конфиг: ${msg}` };
  }
  const parsed = parseConf(text);
  if (!parsed.ok) {
    const loc = parsed.error.line ? `:${parsed.error.line}` : "";
    return { ok: false, error: `${filePath}${loc}: ${parsed.error.message}` };
  }
  return { ok: true, data: parsed.data };
}

/**
 * @param {string} targetPath
 * @param {string} cwd
 * @returns {string}
 */
export function resolveProjectConfPath(targetPath, cwd) {
  const root = findProjectRoot(dirname(targetPath), cwd);
  return join(root, "dependra.conf");
}

/**
 * @returns {string}
 */
export function resolveUserConfPath() {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg && xdg.length > 0) {
    return join(xdg, "dependra", "dependra.conf");
  }
  return join(homedir(), ".config", "dependra", "dependra.conf");
}

/**
 * Deep-merge: objects merge; arrays/scalars replace.
 * @param {object} base
 * @param {object} over
 * @returns {object}
 */
export function deepMerge(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over ?? {})) {
    if (
      v != null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      out[k] != null &&
      typeof out[k] === "object" &&
      !Array.isArray(out[k])
    ) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * @param {object} raw
 * @param {boolean} strict
 * @returns {{ ok: true, model: object } | { ok: false, error: string, warnings?: string[] }}
 */
export function normalizeConfData(raw, strict = false) {
  const model = emptyConfigModel();
  /** @type {string[]} */
  const warnings = [];

  for (const [k, v] of Object.entries(raw ?? {})) {
    if (
      k === "pathMode" ||
      k === "output" ||
      k === "defaultProfile" ||
      k === "strict" ||
      k === "defaults" ||
      k === "operations" ||
      k === "report" ||
      k === "flags" ||
      k === "profiles" ||
      k === "ai"
    ) {
      continue;
    }
    const msg = `Неизвестный ключ конфига: ${k}`;
    if (strict || raw.strict === true) {
      return { ok: false, error: msg };
    }
    warnings.push(msg);
  }

  if (raw.pathMode != null) {
    if (!["name", "relative", "absolute"].includes(raw.pathMode)) {
      return { ok: false, error: `Неверный pathMode: ${raw.pathMode}` };
    }
    model.pathMode = raw.pathMode;
  }
  if (raw.output != null) {
    if (raw.output !== "text" && raw.output !== "json") {
      return { ok: false, error: `Неверный output: ${raw.output}` };
    }
    model.output = raw.output;
    model.report.format = raw.output;
  }
  if ("defaultProfile" in (raw ?? {})) {
    model.defaultProfile = raw.defaultProfile;
  }
  if (typeof raw.strict === "boolean") model.strict = raw.strict;

  if (raw.defaults && typeof raw.defaults === "object") {
    model.defaults = deepMerge(model.defaults, raw.defaults);
  }
  if (raw.operations && typeof raw.operations === "object") {
    for (const [k, v] of Object.entries(raw.operations)) {
      if (!OPERATION_KEYS.includes(k)) {
        const msg = `Неизвестная operation: ${k}`;
        if (model.strict) return { ok: false, error: msg };
        warnings.push(msg);
        continue;
      }
      model.operations[k] = Boolean(v);
    }
  }
  if (raw.report && typeof raw.report === "object") {
    model.report = deepMerge(model.report, normalizeReport(raw.report));
  }
  if (raw.flags && typeof raw.flags === "object") {
    model.flags = normalizeFlags(raw.flags, model.flags);
  }
  if (raw.profiles && typeof raw.profiles === "object") {
    model.profiles = raw.profiles;
  }
  if (raw.ai && typeof raw.ai === "object") {
    if ("apiKey" in raw.ai || "api_key" in raw.ai || "secret" in raw.ai) {
      return {
        ok: false,
        error: "Секреты в [ai] запрещены; используйте apiKeyEnv",
      };
    }
    model.ai = deepMerge(model.ai, raw.ai);
  }

  return { ok: true, model, warnings };
}

/**
 * @param {object} report
 * @returns {object}
 */
function normalizeReport(report) {
  const out = { ...report };
  if (typeof out.hideSections === "string") {
    out.hideSections = out.hideSections.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (out.hideSections == null) out.hideSections = [];
  if (typeof out.sectionOrder === "string") {
    out.sectionOrder = out.sectionOrder.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return out;
}

/**
 * @param {object} flags
 * @param {object} base
 * @returns {object}
 */
function normalizeFlags(flags, base) {
  const out = {
    aliases: { ...base.aliases },
    rename: { ...base.rename },
    disable: [...(base.disable ?? [])],
  };
  if (flags.aliases && typeof flags.aliases === "object") {
    for (const [canon, aliases] of Object.entries(flags.aliases)) {
      const list = Array.isArray(aliases)
        ? aliases
        : typeof aliases === "string"
          ? aliases.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
      out.aliases[canon] = list;
    }
  }
  if (flags.rename && typeof flags.rename === "object") {
    out.rename = { ...out.rename, ...flags.rename };
  }
  if (flags.disable != null) {
    out.disable = Array.isArray(flags.disable)
      ? flags.disable
      : String(flags.disable)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
  }
  return out;
}

/**
 * @param {{
 *   targetPath: string,
 *   cwd: string,
 *   explicitConfigPath?: string|null,
 * }} opts
 * @returns {{ ok: true, model: object, configPath: string|null, warnings: string[] } | { ok: false, error: string }}
 */
export function loadMergedConfig(opts) {
  const { targetPath, cwd, explicitConfigPath = null } = opts;
  let model = emptyConfigModel();
  /** @type {string[]} */
  const warnings = [];
  /** @type {string|null} */
  let configPath = null;

  const userPath = resolveUserConfPath();
  if (existsSync(userPath)) {
    const loaded = loadConfFile(userPath);
    if (!loaded.ok) return loaded;
    const norm = normalizeConfData(loaded.data, Boolean(loaded.data.strict));
    if (!norm.ok) return { ok: false, error: norm.error };
    warnings.push(...(norm.warnings ?? []));
    model = deepMerge(model, stripProfilesForMerge(norm.model));
    model.profiles = deepMerge(model.profiles, norm.model.profiles ?? {});
    model.flags = mergeFlags(model.flags, norm.model.flags);
  }

  let projectPath;
  if (explicitConfigPath) {
    projectPath = isAbsolute(explicitConfigPath)
      ? explicitConfigPath
      : resolve(cwd, explicitConfigPath);
    if (!projectPath.endsWith(".conf") && !projectPath.endsWith("dependra.conf")) {
      return {
        ok: false,
        error: `Конфиг должен быть .conf: ${projectPath}`,
      };
    }
    if (!existsSync(projectPath)) {
      return { ok: false, error: `Конфиг не найден: ${projectPath}` };
    }
  } else {
    projectPath = resolveProjectConfPath(targetPath, cwd);
  }

  if (existsSync(projectPath)) {
    const loaded = loadConfFile(projectPath);
    if (!loaded.ok) return loaded;
    const norm = normalizeConfData(loaded.data, Boolean(loaded.data.strict));
    if (!norm.ok) return { ok: false, error: norm.error };
    warnings.push(...(norm.warnings ?? []));
    model = deepMerge(model, stripProfilesForMerge(norm.model));
    model.profiles = deepMerge(model.profiles, norm.model.profiles ?? {});
    model.flags = mergeFlags(model.flags, norm.model.flags);
    configPath = projectPath;
  } else if (explicitConfigPath) {
    return { ok: false, error: `Конфиг не найден: ${projectPath}` };
  }

  return { ok: true, model, configPath, warnings };
}

/**
 * @param {object} model
 * @returns {object}
 */
function stripProfilesForMerge(model) {
  const { profiles, flags, ...rest } = model;
  return rest;
}

/**
 * @param {object} a
 * @param {object} b
 * @returns {object}
 */
function mergeFlags(a, b) {
  return {
    aliases: { ...(a.aliases ?? {}), ...(b.aliases ?? {}) },
    rename: { ...(a.rename ?? {}), ...(b.rename ?? {}) },
    disable: [...new Set([...(a.disable ?? []), ...(b.disable ?? [])])],
  };
}

/**
 * Применить профиль к модели.
 * @param {object} model
 * @param {string} name
 * @returns {{ ok: true, model: object } | { ok: false, error: string }}
 */
export function applyProfile(model, name) {
  const profile = model.profiles?.[name];
  if (!profile || typeof profile !== "object") {
    return { ok: false, error: `Неизвестный профиль: ${name}` };
  }
  const next = { ...model };
  if (profile.operations) {
    next.operations = { ...next.operations };
    for (const [k, v] of Object.entries(profile.operations)) {
      if (OPERATION_KEYS.includes(k) && v) next.operations[k] = true;
    }
  }
  if (profile.pathMode) next.pathMode = profile.pathMode;
  if (profile.output) {
    next.output = profile.output;
    next.report = { ...next.report, format: profile.output };
  }
  return { ok: true, model: next };
}

/**
 * @param {object} model
 * @param {number} level
 * @returns {{ ok: true, model: object } | { ok: false, error: string }}
 */
export function applyLevel(model, level) {
  const ops = operationsForLevel(level);
  if (!ops) {
    return { ok: false, error: `--level должен быть 1..5, получено: ${level}` };
  }
  const next = {
    ...model,
    operations: { ...model.operations },
  };
  for (const k of ops) {
    next.operations[k] = true;
  }
  return { ok: true, model: next };
}

/**
 * Построить карту alias/rename → canonical token.
 * @param {object} flags
 * @returns {{ ok: true, map: Map<string, string> } | { ok: false, error: string }}
 */
export function buildAliasMap(flags) {
  /** @type {Map<string, string>} */
  const map = new Map();
  const rename = flags?.rename ?? {};
  const aliases = flags?.aliases ?? {};

  for (const [canon, alt] of Object.entries(rename)) {
    if (typeof alt !== "string" || !alt.startsWith("-")) {
      return { ok: false, error: `Некорректный rename для ${canon}` };
    }
    if (map.has(alt) && map.get(alt) !== canon) {
      return { ok: false, error: `Конфликт rename/alias: ${alt}` };
    }
    map.set(alt, canon);
  }

  for (const [canon, list] of Object.entries(aliases)) {
    for (const alt of list ?? []) {
      if (typeof alt !== "string" || !alt.startsWith("-")) {
        return { ok: false, error: `Некорректный alias для ${canon}: ${alt}` };
      }
      if (map.has(alt) && map.get(alt) !== canon) {
        return { ok: false, error: `Конфликт alias: ${alt}` };
      }
      map.set(alt, canon);
    }
  }

  return { ok: true, map };
}

/**
 * @param {string[]} argv
 * @param {Map<string, string>} aliasMap
 * @returns {string[]}
 */
export function rewriteArgvAliases(argv, aliasMap) {
  return argv.map((arg) => {
    if (!arg.startsWith("-")) return arg;
    return aliasMap.get(arg) ?? arg;
  });
}
