/**
 * Resolve CLI: load .conf → aliases → parse → merge level/profile/ops.
 */

import { isAbsolute, resolve } from "node:path";
import {
  OPERATION_KEYS,
  applyLevel,
  applyProfile,
  buildAliasMap,
  loadMergedConfig,
  rewriteArgvAliases,
} from "../config/index.js";
import { parseArgs, peekConfigPath } from "./parse-args.js";

/**
 * Позиционный target без полного parse (игнор неизвестных флагов).
 * @param {string[]} argv
 * @returns {string|null}
 */
function peekTargetPath(argv) {
  const valueFlags = new Set([
    "--path-mode",
    "-p",
    "--level",
    "-l",
    "--profile",
    "-pr",
    "--config",
    "-cf",
    "--undo-session",
    "--change",
    "--changes",
    "--pm",
    "--install-package",
    "--aim-instruction",
  ]);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (valueFlags.has(arg)) {
      i += 1;
      continue;
    }
    if (arg.startsWith("-")) continue;
    return arg;
  }
  return null;
}

/**
 * @param {string[]} argv
 * @param {{ cwd?: string }} [env]
 * @returns {import('./parse-args.js').ParsedCli & { warnings?: string[] }}
 */
export function resolveCli(argv, env = {}) {
  const cwd = env.cwd ?? process.cwd();
  const peek = peekConfigPath(argv);
  if (peek.error) {
    return emptyError(peek.error);
  }

  const targetPeek = peekTargetPath(argv);
  const targetForRoot = targetPeek
    ? isAbsolute(targetPeek)
      ? targetPeek
      : resolve(cwd, targetPeek)
    : resolve(cwd, ".");

  const loaded = loadMergedConfig({
    targetPath: targetForRoot,
    cwd,
    explicitConfigPath: peek.configPath,
  });
  if (!loaded.ok) {
    return emptyError(loaded.error);
  }

  let model = loaded.model;
  const warnings = [...(loaded.warnings ?? [])];

  const aliasBuilt = buildAliasMap(model.flags);
  if (!aliasBuilt.ok) {
    return emptyError(aliasBuilt.error);
  }

  const rewritten = rewriteArgvAliases(argv, aliasBuilt.map);
  const parsed = parseArgs(rewritten, { skipDefaultAll: true });
  if (parsed.error) {
    return { ...parsed, warnings };
  }

  const disabled = new Set(model.flags.disable ?? []);
  for (const arg of rewritten) {
    if (disabled.has(arg)) {
      return {
        ...parsed,
        error: `Флаг отключён в конфиге: ${arg}`,
        warnings,
      };
    }
  }

  const profileName = parsed.profileArg ?? model.defaultProfile;
  if (profileName) {
    const applied = applyProfile(model, profileName);
    if (!applied.ok) {
      return { ...parsed, error: applied.error, warnings };
    }
    model = applied.model;
    parsed.options.profile = profileName;
  }

  if (parsed.levelArg != null) {
    const applied = applyLevel(model, parsed.levelArg);
    if (!applied.ok) {
      return { ...parsed, error: applied.error, warnings };
    }
    model = applied.model;
  }

  for (const key of OPERATION_KEYS) {
    if (model.operations[key]) {
      parsed.options[key] = true;
    }
  }

  if (model.pathMode && !cliHadPathMode(rewritten)) {
    parsed.options.pathMode = model.pathMode;
  }
  if (
    (model.output === "json" || model.report?.format === "json") &&
    !cliHadJson(rewritten)
  ) {
    parsed.options.json = true;
  }

  parsed.options.report = model.report;
  parsed.options.ai = model.ai;
  parsed.options.configPath = loaded.configPath;
  if (parsed.levelArg != null) parsed.options.level = parsed.levelArg;

  const sawCliOp = Boolean(parsed.sawAnyOp);
  const anyOp = OPERATION_KEYS.some((k) => parsed.options[k]);

  if (!sawCliOp && !anyOp) {
    const when = model.defaults?.whenNoFlags ?? "s01-all";
    if (when === "s01-all") {
      parsed.options.basic = true;
      parsed.options.imports = true;
      parsed.options.exports = true;
      parsed.options.graph = true;
    } else if (when !== "none") {
      const applied = applyProfile(model, when);
      if (!applied.ok) {
        return { ...parsed, error: applied.error, warnings };
      }
      for (const key of OPERATION_KEYS) {
        if (applied.model.operations[key]) parsed.options[key] = true;
      }
    }
  }

  // S06: ai.explain → options.explain; explain OR-включает quality
  if (model.ai?.explain) {
    parsed.options.explain = true;
  }
  if (parsed.options.explain) {
    parsed.options.quality = true;
  }

  // Mutate-only / undo: never leave empty analysis with accidental s01 from conf none —
  // already handled via sawAnyOp. Apply/dry-run stay CLI-only (not from conf).

  return { ...parsed, warnings };
}

/**
 * @param {string} error
 */
function emptyError(error) {
  return {
    help: false,
    version: false,
    targetPath: null,
    options: /** @type {any} */ ({
      basic: false,
      imports: false,
      exports: false,
      graph: false,
      json: false,
      pathMode: "relative",
    }),
    error,
  };
}

/**
 * @param {string[]} argv
 * @returns {boolean}
 */
function cliHadPathMode(argv) {
  return argv.includes("--path-mode") || argv.includes("-p");
}

/**
 * @param {string[]} argv
 * @returns {boolean}
 */
function cliHadJson(argv) {
  return argv.includes("--json") || argv.includes("-j");
}
