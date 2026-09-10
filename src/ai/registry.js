/**
 * Реестр AI provider adapters (S06).
 */

/** @type {Map<string, import('./providers/mock.js').AiProvider>} */
const providers = new Map();

/**
 * @param {import('./providers/mock.js').AiProvider} provider
 */
export function registerAiProvider(provider) {
  providers.set(provider.id, provider);
}

/**
 * @param {string} id
 * @returns {import('./providers/mock.js').AiProvider|undefined}
 */
export function getAiProvider(id) {
  return providers.get(id);
}

/**
 * @returns {string[]}
 */
export function listAiProviderIds() {
  return [...providers.keys()];
}
