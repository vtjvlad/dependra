import { fromA } from "./cycle-a.js";

export function fromB() {
  return fromA;
}
