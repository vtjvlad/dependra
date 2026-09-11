/**
 * Smoke sample for Dependra S09 (TypeScript analysis).
 * Try: node src/cli/index.js sample-s09.ts -b -i -e -g -j
 */

import { readFileSync } from "node:fs";
import type { Dirent } from "node:fs";
import { join } from "node:path";

export type SampleMeta = {
  name: string;
  tags: string[];
};

export interface SampleStats {
  bytes: number;
  lines: number;
}

const NAME = "dependra-s09-sample";

export function describeSample(meta: SampleMeta): string {
  return `${meta.name} [${meta.tags.join(", ")}]`;
}

export function fileStats(relPath: string): SampleStats {
  const abs = join(process.cwd(), relPath);
  const text = readFileSync(abs, "utf8");
  return {
    bytes: Buffer.byteLength(text, "utf8"),
    lines: text.split(/\r?\n/).length,
  };
}

export function unusedTypeProbe(_entry: Dirent): void {
  // type-only import above should appear with importKind: "type"
}

export default function main(): SampleMeta {
  return { name: NAME, tags: ["typescript", "s09"] };
}
