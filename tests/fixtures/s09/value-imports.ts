import { helper } from "./util.js";
import { shared } from "./shared";

export function greet(name: string): string {
  return helper(name) + shared;
}

export const answer: number = 42;
