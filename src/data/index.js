/**
 * Data Module - Main Export
 *
 * Re-exports all data operations from domain modules for convenience.
 * This maintains backward compatibility with existing imports.
 */

// Parsing operations
export { parseTabFormat, mergeParsedArray } from './parsing';

// Recipe operations
export { safeR, saveRecipesBatched, loadRecipes } from './recipes';

// Grocery and data combination operations
export { mergeGrocery, combineParsed } from './grocery';
