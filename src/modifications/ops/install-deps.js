/**
 * install-deps — PM install plan / exec.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { findProjectRoot } from "../../inspectors/scan-js-files.js";
import { nextChangeId } from "./_helpers.js";

/**
 * @param {string} root
 * @returns {"npm"|"pnpm"|"yarn"|"bun"}
 */
export function detectPm(root) {
  if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(root, "yarn.lock"))) return "yarn";
  if (existsSync(join(root, "bun.lockb")) || existsSync(join(root, "bun.lock")))
    return "bun";
  return "npm";
}

/**
 * @param {import('../../core/types.js').AnalysisContext} ctx
 * @param {object} _results
 * @param {object} state
 */
export function buildInstallDepsChanges(ctx, _results, state) {
  const root = findProjectRoot(dirname(ctx.targetPath), ctx.cwd);
  const pkgPath = join(root, "package.json");
  const pm =
    ctx.options.pm && ["npm", "pnpm", "yarn", "bun"].includes(ctx.options.pm)
      ? ctx.options.pm
      : detectPm(root);

  /** @type {string[]} */
  const argv = ["install"];
  const pkgName = ctx.options.installPackage;
  if (pkgName) {
    argv.push(String(pkgName));
  }

  /** @type {string[]} */
  const packages = [];
  if (pkgName) {
    packages.push(String(pkgName));
  } else if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const deps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
      };
      for (const name of Object.keys(deps)) {
        const mod = join(root, "node_modules", name);
        if (!existsSync(mod)) packages.push(name);
      }
    } catch {
      /* ignore */
    }
  }

  return [
    {
      id: nextChangeId(state),
      kind: /** @type {const} */ ("exec"),
      path: pkgPath,
      display: "package.json",
      op: "install-deps",
      summary: `${pm} ${argv.join(" ")}`,
      risk: /** @type {const} */ ("dangerous"),
      selected: true,
      details: {
        pm,
        cwd: root,
        argv,
        packages,
        timeoutMs: 120_000,
      },
    },
  ];
}

export const installDepsOp = {
  id: "install-deps",
  build: buildInstallDepsChanges,
};
