/**
 * Recipe Storage Module
 *
 * Handles recipe persistence, normalization, and retrieval from localStorage.
 */

import { storage } from '../storage';
import { STORAGE_KEYS } from '../config';

/**
 * Normalize a recipe object with safe defaults
 * Ensures all required fields exist and handles old format conversions
 */
export function safeR(r, i, isBatch) {
  const name = (r && r.name) ? r.name : 'Recipe ' + (i + 1);

  // Normalize ingredients to always be objects with { text, category }
  let ingredients = [];
  if (r && Array.isArray(r.ingredients)) {
    ingredients = r.ingredients.map(ing => {
      // If already an object with text property, return as-is
      if (typeof ing === 'object' && ing.text) {
        return ing;
      }
      // If it's a string (old format), convert to object
      if (typeof ing === 'string') {
        return { text: ing, category: undefined };
      }
      return { text: String(ing || ''), category: undefined };
    });
  }

  return {
    id: name + '_' + i,
    number: (r && r.number) ? r.number : i + 1,
    name,
    cuisine: (r && r.cuisine) ? r.cuisine : 'Unknown',
    cookTime: (r && r.cookTime) ? r.cookTime : '30 mins',
    caloriesPerServing: (r && r.caloriesPerServing) ? r.caloriesPerServing : '—',
    ingredients,
    workflow: (r && Array.isArray(r.workflow)) ? r.workflow : [],
    isBatchCook: isBatch || false,
  };
}

/**
 * Save recipes to localStorage in batches
 * Deduplicates by recipe name (case-insensitive)
 */
export async function saveRecipesBatched(weekly, batch) {
  async function save(recipes, key) {
    if (!recipes.length) return;
    try {
      let ex = [];
      try {
        const r = await storage.get(key);
        if (r) ex = JSON.parse(r.value);
      } catch (e) {
        // Ignore parse errors, start fresh
      }

      const names = new Set(ex.map(r => r.name.toLowerCase().trim()));
      const news = recipes.filter(r => !names.has(r.name.toLowerCase().trim()));

      if (news.length) {
        await storage.set(key, JSON.stringify(ex.concat(news)));
      }
    } catch (e) {
      console.error('Failed to save recipes:', e);
    }
  }

  await Promise.all([
    save(weekly, STORAGE_KEYS.RECIPES_ALL),
    save(batch, STORAGE_KEYS.RECIPES_BATCH)
  ]);
}

/**
 * Load recipes from localStorage
 * Returns empty array if storage fails or key doesn't exist
 */
export async function loadRecipes(key) {
  try {
    const r = await storage.get(key || STORAGE_KEYS.RECIPES_ALL);
    return r ? JSON.parse(r.value) : [];
  } catch (e) {
    return [];
  }
}
