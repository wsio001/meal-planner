/**
 * Grocery List Module
 *
 * Handles grocery list merging and meal data combination.
 * Manages the consolidation of weekly and batch cook grocery items.
 */

import { safeR } from './recipes';

/**
 * Merge multiple grocery lists, deduplicating by item name
 * Combines recipe references for duplicate items
 */
export function mergeGrocery(...lists) {
  const seen = {}, result = [];

  lists.flat().forEach(row => {
    if (!Array.isArray(row) || !row[1]) return;

    const [type, item, qty = '', rec = ''] = row.map(s => String(s || '').trim());
    const key = item.toLowerCase();
    if (!key) return;

    if (seen[key]) {
      seen[key][3] += ', ' + rec;
    } else {
      const e = [type, item, qty, rec];
      seen[key] = e;
      result.push(e);
    }
  });

  return result;
}

/**
 * Combine weekly and batch cook parsed data with past selections
 * Returns: { recipes, grocery, iphoneNotes, overview }
 */
export function combineParsed(wP, bP, pastBatch) {
  // Process weekly recipes
  const wR = (wP.recipes || []).map((r, i) => ({ ...safeR(r, i, false), isBatchCook: false }));

  // Process past batch recipes from history
  const pastB = (pastBatch || []).map((r, i) =>
    (r && r.name && r.ingredients)
      ? { ...r, id: r.id || (r.name + '_past_' + i), isBatchCook: true }
      : { ...safeR(r, i, true), isBatchCook: true }
  );

  // Process new batch recipes
  const newB = (bP.recipes || []).map((r, i) => ({ ...safeR(r, i, true), isBatchCook: true }));

  // Combine all recipes and re-number
  const all = [...wR, ...pastB, ...newB].map((r, i) => ({ ...r, number: i + 1 }));

  // Merge grocery lists
  const grocery = mergeGrocery(wP.grocery || [], bP.grocery || []);

  // Merge iPhone notes, deduplicating by ingredient name
  const noteKeys = ['Produce', 'Protein/Meat', 'Grains', 'Dairy', 'Pantry/Spices'];
  const iphoneNotes = {};

  noteKeys.forEach(k => {
    const seen = new Set();
    iphoneNotes[k] = [...(wP.iphoneNotes?.[k] || []), ...(bP.iphoneNotes?.[k] || [])]
      .filter(x => {
        if (!x) return false;
        const key = x.split('-')[0].trim().toLowerCase();
        return seen.has(key) ? false : (seen.add(key), true);
      });
  });

  // Create overview from all recipes
  const overview = all.map(r => [r.name, r.cuisine, r.isBatchCook]);

  return { recipes: all, grocery, iphoneNotes, overview };
}
