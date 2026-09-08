/**
 * Разбор argv CLI (docs/50-cli/interface.md, s02-flags.md).
 *
 * @typedef {import('../core/types.js').AnalysisOptions} AnalysisOptions
 *
 * @typedef {object} ParsedCli
 * @property {boolean} help
 * @property {boolean} version
 * @property {string|null} targetPath
 * @property {AnalysisOptions} options
 * @property {string|null} error
 */

const PATH_MODES = new Set(["name", "relative", "absolute"]);

/**
 * @param {string[]} argv process.argv.slice(2)
 * @returns {ParsedCli}
 */
export function parseArgs(argv) {
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
      json: false,
      pathMode: "relative",
    },
    error: null,
  };

  let sawS01Op = false;
  let sawS02Op = false;

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

  // Default-all: только когда нет ни S01, ни S02 operation-флагов
  if (!sawS01Op && !sawS02Op) {
    result.options.basic = true;
    result.options.imports = true;
    result.options.exports = true;
    result.options.graph = true;
  }

  return result;
}
