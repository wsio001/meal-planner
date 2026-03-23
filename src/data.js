/**
 * @deprecated This file has been split into domain modules.
 * Use the new structure:
 *   - import { parseTabFormat } from './data/parsing'
 *   - import { loadRecipes } from './data/recipes'
 *   - import { mergeGrocery } from './data/grocery'
 *
 * Or import from './data' (resolves to './data/index.js') for all exports.
 */

// Re-export everything from the new modular structure for backward compatibility
export * from './data';
