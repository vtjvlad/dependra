/**
 * @license MIT
 * @fileoverview App entry
 */
import { helper } from "./lib.js";
import fs from "fs";

export function run() {
  return helper() + String(fs);
}
