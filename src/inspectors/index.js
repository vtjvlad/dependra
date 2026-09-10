import { registerInspector } from "../core/registry.js";
import { additionalFileInformationInspector } from "./additional-file-information.js";
import { basicFileInformationInspector } from "./basic-file-information.js";
import { commandsInspector } from "./commands.js";
import { dependencyAnalysisInspector } from "./dependency-analysis.js";
import { environmentValidationInspector } from "./environment-validation.js";
import { exportedEntitiesInspector } from "./exported-entities.js";
import { fileEnvironmentAnalysisInspector } from "./file-environment-analysis.js";
import { fileOperationsInspector } from "./file-operations.js";
import { importExportAnalysisInspector } from "./import-export-analysis.js";
import { metadataInspector } from "./metadata.js";
import { codeQualityAnalysisInspector } from "./code-quality-analysis.js";
import { runtimeDependencyAnalysisInspector } from "./runtime-dependency-analysis.js";
import { validationInspector } from "./validation.js";
import { visualizationInspector } from "./visualization.js";

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
  registerInspector(validationInspector);
  registerInspector(fileEnvironmentAnalysisInspector);
  registerInspector(commandsInspector);
  registerInspector(environmentValidationInspector);
  registerInspector(runtimeDependencyAnalysisInspector);
  registerInspector(fileOperationsInspector);
  registerInspector(visualizationInspector);
  registerInspector(metadataInspector);
  registerInspector(codeQualityAnalysisInspector);
}
