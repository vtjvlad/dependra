import { registerInspector } from "../core/registry.js";
import { basicFileInformationInspector } from "./basic-file-information.js";
import { importExportAnalysisInspector } from "./import-export-analysis.js";

/**
 * Регистрация инспекторов, доступных в текущей версии.
 * Вызывать один раз при старте CLI.
 */
export function registerBuiltInInspectors() {
  registerInspector(basicFileInformationInspector);
  registerInspector(importExportAnalysisInspector);
}
