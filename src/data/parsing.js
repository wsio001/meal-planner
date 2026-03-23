/**
 * API Response Parsing Module
 *
 * Handles parsing of Claude API responses in tab-separated format.
 * Extracts recipes, grocery lists, and iPhone notes from structured text.
 */

/**
 * Helper to find category for an ingredient by matching against grocery items
 */
function findCategory(ingredientText, categoryLookup) {
  const lower = ingredientText.toLowerCase();
  // Try to find a match in the category lookup
  for (const [item, category] of Object.entries(categoryLookup)) {
    if (lower.includes(item)) {
      return category;
    }
  }
  // Fallback to undefined if not found
  return undefined;
}

/**
 * Parse tab-formatted text from Claude API
 * Returns: { overview, grocery, recipes, iphoneNotes }
 */
export function parseTabFormat(text) {
  const empty = {
    overview: [],
    grocery: [],
    recipes: [],
    iphoneNotes: {
      Produce: [],
      'Protein/Meat': [],
      Grains: [],
      Dairy: [],
      'Pantry/Spices': []
    }
  };

  if (!text) return empty;

  const parts = text.split(/-----TAB[123]-----/);
  if (parts.length < 4) return empty;

  const [, raw1, raw2, raw3] = parts;

  // Parse overview (tab 1)
  const overview = [];
  raw1.trim().split('\n').forEach(l => {
    l = l.trim();
    if (!l) return;
    const p = l.split('\t');
    if (p.length >= 2) {
      overview.push([p[0].trim(), p[1].trim()]);
    }
  });

  // Parse grocery list (tab 2)
  const grocery = [];
  const iph = {
    Produce: [],
    'Protein/Meat': [],
    Grains: [],
    Dairy: [],
    'Pantry/Spices': []
  };
  const categoryLookup = {}; // Map ingredient item to category

  raw2.trim().split('\n').forEach(l => {
    l = l.trim();
    if (!l) return;
    const p = l.split(/\t|  +/);
    if (p.length >= 4) {
      const [type, item, qty, ...rest] = p.map(s => s.trim());
      grocery.push([type, item, qty, rest.join(' ')]);

      // Store category for this ingredient item (normalized to lowercase)
      categoryLookup[item.toLowerCase()] = type;

      const entry = item + ' - ' + qty;
      if (type === 'Produce') iph['Produce'].push(entry);
      else if (type === 'Protein/Meat') iph['Protein/Meat'].push(entry);
      else if (type === 'Grain') iph['Grains'].push(entry);
      else if (type === 'Dairy') iph['Dairy'].push(entry);
      else iph['Pantry/Spices'].push(item);
    }
  });

  // Parse recipes (tab 3)
  const recipes = [];
  raw3.trim().split(/\n(?=Recipe Name:)/i).forEach((blk, idx) => {
    if (!blk.trim()) return;

    const r = {
      number: idx + 1,
      name: '',
      cuisine: '',
      cookTime: '',
      caloriesPerServing: 0,
      ingredients: [],
      workflow: []
    };

    let mode = 'header';
    blk.trim().split('\n').forEach(l => {
      l = l.trim();
      if (!l) return;

      if (/^recipe name:/i.test(l)) { r.name = l.replace(/^recipe name:\s*/i, ''); return; }
      if (/^cuisine:/i.test(l)) { r.cuisine = l.replace(/^cuisine:\s*/i, ''); return; }
      if (/^cook time:/i.test(l)) { r.cookTime = l.replace(/^cook time:\s*/i, ''); return; }
      if (/^calories:/i.test(l)) { r.caloriesPerServing = parseInt(l.replace(/^calories:\s*/i, '')) || 0; return; }
      if (/^INGREDIENTS/i.test(l)) { mode = 'ingredients'; return; }
      if (/^OPTIMIZED COOKING/i.test(l)) { mode = 'workflow'; return; }

      if (mode === 'ingredients') {
        // Try to find category from grocery list
        const category = findCategory(l, categoryLookup);
        r.ingredients.push({ text: l, category });
      } else if (mode === 'workflow') {
        r.workflow.push(l);
      }
    });

    if (r.name) recipes.push(r);
  });

  return { overview, grocery, recipes, iphoneNotes: iph };
}

/**
 * Merge multiple parsed results into one
 * Used when combining results from multiple API calls
 */
export function mergeParsedArray(parsedArr) {
  const noteKeys = ['Produce', 'Protein/Meat', 'Grains', 'Dairy', 'Pantry/Spices'];
  const iphoneNotes = {};
  noteKeys.forEach(k => iphoneNotes[k] = []);

  const allRecipes = [], allGrocery = [];
  parsedArr.forEach(p => {
    allRecipes.push(...(p.recipes || []));
    allGrocery.push(...(p.grocery || []));
    noteKeys.forEach(k => {
      if (p.iphoneNotes?.[k]) {
        iphoneNotes[k].push(...p.iphoneNotes[k]);
      }
    });
  });

  return { recipes: allRecipes, grocery: allGrocery, iphoneNotes };
}
