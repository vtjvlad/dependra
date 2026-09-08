import { PACKAGE_VERSION } from "../version.js";
import {
  createPalette,
  formatBanner,
  frameSection,
  useColor,
  visibleWidth,
} from "../reporters/style.js";

/**
 * @param {string} flags
 * @param {string} desc
 * @param {number} col
 * @param {ReturnType<typeof createPalette>} pal
 * @returns {string}
 */
function flagRow(flags, desc, col, pal) {
  const left = pal.bold(flags);
  const gap = Math.max(2, col - visibleWidth(flags));
  return `${left}${" ".repeat(gap)}${desc}`;
}

/**
 * Schematic help для CLI.
 *
 * @param {{ color?: boolean }} [opts]
 * @returns {string}
 */
export function formatHelp(opts = {}) {
  const color =
    opts.color === undefined ? useColor() : Boolean(opts.color);
  const pal = createPalette(color);
  const col = 28;

  /** @type {string[]} */
  const lines = [
    `${pal.bold("dependra")} ${pal.dim(PACKAGE_VERSION)} ${pal.dim("·")} ${pal.cyan("schematic")}`,
    `${pal.dim("cli")}     анализ одного JS-файла (ESM / CJS)`,
    "",
  ];

  lines.push(
    ...frameSection(
      "usage",
      [
        `${pal.cyan("→")}  ${pal.bold("dependra")} ${pal.dim("<file>")} ${pal.dim("[options]")}`,
        `${pal.cyan("→")}  ${pal.bold("fds")}${pal.dim("|")}${pal.bold("deps")}${pal.dim("|")}${pal.bold("dep")} ${pal.dim("<file> [options]")}`,
        `${pal.cyan("→")}  node src/cli/index.js ${pal.dim("<file> [options]")}`,
      ],
      pal,
    ),
    "",
  );

  lines.push(
    ...frameSection(
      "operations",
      [
        flagRow("-b, --basic", "метаданные файла", col, pal),
        flagRow("-i, --imports", "импорты (AST)", col, pal),
        flagRow("-e, --exports", "экспорты (AST)", col, pal),
        flagRow("-g, --graph", "imported-by  │  imports", col, pal),
        "",
        pal.dim("без operation-флагов → все четыре"),
      ],
      pal,
    ),
    "",
  );

  lines.push(
    ...frameSection(
      "output",
      [
        flagRow("-j, --json", "JSON вместо schematic text", col, pal),
        flagRow(
          "-p, --path-mode <mode>",
          "name │ relative │ absolute",
          col,
          pal,
        ),
        pal.dim("default path-mode: relative"),
      ],
      pal,
    ),
    "",
  );

  lines.push(
    ...frameSection(
      "meta",
      [
        flagRow("-h, --help", "эта справка", col, pal),
        flagRow("-v, --version", `Dependra v${PACKAGE_VERSION}`, col, pal),
      ],
      pal,
    ),
    "",
  );

  lines.push(
    ...frameSection(
      "examples",
      [
        `${pal.dim("$")} dependra src/app.js`,
        `${pal.dim("$")} dependra src/app.js ${pal.cyan("-g")} ${pal.cyan("-p")} name`,
        `${pal.dim("$")} dependra src/app.js ${pal.cyan("-i")} ${pal.cyan("-e")} ${pal.cyan("-j")}`,
      ],
      pal,
    ),
  );

  lines.push(...formatBanner(pal, { tagline: "inspect · connect · understand" }));

  return `${lines.join("\n").trimEnd()}\n`;
}
