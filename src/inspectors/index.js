import { registerInspector } from "../core/registry.js";
import { additionalFileInformationInspector } from "./additional-file-information.js";
import { basicFileInformationInspector } from "./basic-file-information.js";
import { dependencyAnalysisInspector } from "./dependency-analysis.js";
import { exportedEntitiesInspector } from "./exported-entities.js";
import { importExportAnalysisInspector } from "./import-export-analysis.js";

/**
 * Регистрация инспекторов, доступных в текущей версии.
 * Вызывать один раз при старте CLI.
 */
export function registerBuiltInInspectors() {
  registerInspector(basicFileInformationInspector);
  registerInspector(importExportAnalysisInspector);
  registerInspector(dependencyAnalysisInspector);
  registerInspector(additionalFileInformationInspector);
  registerInspector(exportedEntitiesInspector);
}
