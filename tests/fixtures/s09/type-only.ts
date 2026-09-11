import type { Foo } from "./types";
import { value } from "./value-mod";

export type Bar = Foo & { ok: boolean };
export type { Foo };
export { value };

export function use(x: Foo): number {
  return value + (x.n ?? 0);
}
