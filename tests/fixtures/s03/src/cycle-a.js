import { fromB } from "./cycle-b.js";

export function fromA() {
  return fromB();
}
