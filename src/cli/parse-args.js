/**
 * Разбор argv CLI (docs/50-cli/interface.md, s02–s05-flags.md).
 *
 * @typedef {import('../core/types.js').AnalysisOptions} AnalysisOptions
 *
 * @typedef {object} ParsedCli
 * @property {boolean} help
 * @property {boolean} version
 * @property {string|null} targetPath
 * @property {AnalysisOptions} options
 * @property {string|null} error
 * @property {string|null} [configPathArg]
 * @property {string|null} [profileArg]
 * @property {number|null} [levelArg]
 * @property {boolean} [sawAnyOp]
 */

const PATH_MODES = new Set(["name", "relative", "absolute"]);

/**
 * @param {string[]} argv process.argv.slice(2)
 * @param {{ skipDefaultAll?: boolean }} [opts]
 * @returns {ParsedCli}
 */
export function parseArgs(argv, opts = {}) {
  const skipDefaultAll = Boolean(opts.skipDefaultAll);

  /** @type {ParsedCli} */
  const result = {
    help: false,
    version: false,
    targetPath: null,
    options: {
      basic: false,
      imports: false,
      exports: false,
      graph: false,
      additional: false,
      entities: false,
      validate: false,
      environment: false,
      commands: false,
      envCheck: false,
      runtime: false,
      io: false,
      mermaid: false,
      graphviz: false,
      vizJson: false,
      metadata: false,
      json: false,
      pathMode: "relative",
      level: null,
      profile: null,
      configPath: null,
      report: null,
      ai: null,
    },
    error: null,
    configPathArg: null,
    profileArg: null,
    levelArg: null,
    sawAnyOp: false,
  };

  let sawS01Op = false;
  let sawS02Op = false;
  let sawS03Op = false;
  let sawS04Op = false;
  let sawS05Op = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      result.version = true;
      continue;
    }
    if (arg === "--basic" || arg === "-b") {
      result.options.basic = true;
      sawS01Op = true;
      continue;
    }
    if (arg === "--imports" || arg === "-i") {
      result.options.imports = true;
      sawS01Op = true;
      continue;
    }
    if (arg === "--exports" || arg === "-e") {
      result.options.exports = true;
      sawS01Op = true;
      continue;
    }
    if (arg === "--graph" || arg === "-g") {
      result.options.graph = true;
      sawS01Op = true;
      continue;
    }
    if (arg === "--additional" || arg === "-a") {
      result.options.additional = true;
      sawS02Op = true;
      continue;
    }
    if (arg === "--entities" || arg === "-en") {
      result.options.entities = true;
      sawS02Op = true;
      continue;
    }
    if (arg === "--validate" || arg === "-va") {
      result.options.validate = true;
      sawS03Op = true;
      continue;
    }
    if (arg === "--environment" || arg === "-env") {
      result.options.environment = true;
      sawS04Op = true;
      continue;
    }
    if (arg === "--commands" || arg === "-c") {
      result.options.commands = true;
      sawS04Op = true;
      continue;
    }
    if (arg === "--env-check" || arg === "-ec") {
      result.options.envCheck = true;
      sawS04Op = true;
      continue;
    }
    if (arg === "--runtime" || arg === "-r") {
      result.options.runtime = true;
      sawS04Op = true;
      continue;
    }
    if (arg === "--io" || arg === "-io") {
      result.options.io = true;
      sawS04Op = true;
      continue;
    }
    if (arg === "--mermaid" || arg === "-m") {
      result.options.mermaid = true;
      sawS05Op = true;
      continue;
    }
    if (arg === "--graphviz" || arg === "-gr") {
      result.options.graphviz = true;
      sawS05Op = true;
      continue;
    }
    if (arg === "--viz-json" || arg === "-vj") {
      result.options.vizJson = true;
      sawS05Op = true;
      continue;
    }
    if (arg === "--metadata" || arg === "-me") {
      result.options.metadata = true;
      sawS05Op = true;
      continue;
    }
    if (arg === "--json" || arg === "-j") {
      result.options.json = true;
      continue;
    }
    if (arg === "--path-mode" || arg === "-p") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        result.error =
          "Флаг --path-mode/-p требует значение: name|relative|absolute";
        return result;
      }
      if (!PATH_MODES.has(value)) {
        result.error = `Неизвестное значение --path-mode: ${value}`;
        return result;
      }
      result.options.pathMode = /** @type {"name"|"relative"|"absolute"} */ (
        value
      );
      i += 1;
      continue;
    }
    if (arg === "--level" || arg === "-l") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        result.error = "Флаг --level/-l требует значение: 1..5";
        return result;
      }
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        result.error = `--level должен быть 1..5, получено: ${value}`;
        return result;
      }
      result.levelArg = n;
      result.options.level = n;
      i += 1;
      continue;
    }
    if (arg === "--profile" || arg === "-pr") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        result.error = "Флаг --profile/-pr требует имя профиля";
        return result;
      }
      result.profileArg = value;
      result.options.profile = value;
      i += 1;
      continue;
    }
    if (arg === "--config" || arg === "-cf") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        result.error = "Флаг --config/-cf требует путь к .conf";
        return result;
      }
      result.configPathArg = value;
      result.options.configPath = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("-")) {
      result.error = `Неизвестный флаг: ${arg}`;
      return result;
    }
    if (result.targetPath !== null) {
      result.error = `Лишний аргумент: ${arg}`;
      return result;
    }
    result.targetPath = arg;
  }

  const sawAnyOp =
    sawS01Op || sawS02Op || sawS03Op || sawS04Op || sawS05Op;
  result.sawAnyOp = sawAnyOp;

  if (!skipDefaultAll && !sawAnyOp) {
    result.options.basic = true;
    result.options.imports = true;
    result.options.exports = true;
    result.options.graph = true;
  }

  return result;
}

/**
 * Лёгкий pre-scan только для --config/-cf (до alias rewrite).
 * @param {string[]} argv
 * @returns {{ configPath: string|null, error: string|null }}
 */
export function peekConfigPath(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--config" || arg === "-cf") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        return {
          configPath: null,
          error: "Флаг --config/-cf требует путь к .conf",
        };
      }
      return { configPath: value, error: null };
    }
  }
  return { configPath: null, error: null };
}
