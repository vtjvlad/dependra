import { leaf } from "./leaf";
import { fromJs } from "./from-js.js";

export function root(): string {
  return leaf() + fromJs();
}
