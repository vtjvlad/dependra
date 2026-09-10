import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

/** @type {string} */
export const PACKAGE_VERSION = pkg.version;

/** Строка для `dependra --version` */
export function formatCliVersion() {
  return `Dependra v${PACKAGE_VERSION}`;
}
