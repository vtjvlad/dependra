import fs from "node:fs";
import { writeFileSync, unlinkSync } from "node:fs";

const data = fs.readFileSync("./data.json", "utf8");
writeFileSync("./out.txt", data);
const dyn = process.env.OUT;
fs.writeFile(dyn, "x", () => {});
unlinkSync("./tmp.flag");
