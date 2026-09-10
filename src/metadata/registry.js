/**
 * Реестр metadata providers (S05).
 */

/** @type {Map<string, object>} */
const providers = new Map();

/**
 * @param {object} provider
 * @param {string} provider.id
 * @param {(meta: object) => boolean} provider.supports
 * @param {(ctx: object) => Promise<{ data: object }|{ skip: true, reason: string }>} provider.extract
 */
export function registerMetadataProvider(provider) {
  if (!provider?.id) throw new Error("metadata provider требует id");
  providers.set(provider.id, provider);
}

/**
 * @param {string} id
 * @returns {object|undefined}
 */
export function getMetadataProvider(id) {
  return providers.get(id);
}

/**
 * @returns {object[]}
 */
export function listMetadataProviders() {
  return [...providers.values()];
}

export function clearMetadataProviders() {
  providers.clear();
}
