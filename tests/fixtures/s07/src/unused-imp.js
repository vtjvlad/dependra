import { dead } from "./lib.js";
import fs from "fs";

export function used() {
  return fs ? 1 : 0;
}
