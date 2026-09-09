/**
 * Metadata package entry.
 */
export {
  registerMetadataProvider,
  getMetadataProvider,
  listMetadataProviders,
  clearMetadataProviders,
} from "./registry.js";
export {
  fsExtendedProvider,
  embeddedTextProvider,
  exifStubProvider,
  fileMeta,
} from "./providers.js";
