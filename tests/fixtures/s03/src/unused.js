import { dead } from "./lib.js";
import fs from "fs";

export function orphan() {
  return 1;
}

export function used() {
  return fs ? 2 : 0;
}
