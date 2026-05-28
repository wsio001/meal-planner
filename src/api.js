import { CUISINES, DEFAULT_RULES } from './constants';
import { API_CONFIG, COOKING_METHODS } from './config';

// API key is now passed from the user's settings

export function chunkArr(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export function pickCuisines(n) {
  const pool = [...CUISINES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/**
 * Check if two cooking methods conflict (can't be done simultaneously)
 *
 * Stovetop Rules (max 2 burners active, 4 available):
 * - Stovetop + Stovetop = ❌ (both need active attention)
 * - Stovetop + Stovetop/Simmer = ✅ (one active, one simmer)
 * - Stovetop + Stovetop/Oven = ✅ (oven frees burner)
 * - Stovetop/Simmer + Stovetop/Simmer = ✅ (both can simmer)
 * - Stovetop/Oven + Stovetop/Oven = ❌ (same oven)
 * - Stovetop/Oven + Stovetop/Simmer = ✅ (different equipment)
 *
 * Other Rules:
 * - Same non-stovetop method = conflict (Oven + Oven)
 * - Stovetop/Oven conflicts with pure Oven (both need oven)
 */
export function methodsConflict(method1, method2) {
  if (!method1 || !method2) return false;

  const m1 = method1.trim().toLowerCase();
  const m2 = method2.trim().toLowerCase();

  // Exact same method = conflict
  if (m1 === m2) return true;

  // Stovetop conflict rules
  const isM1Stovetop = m1 === 'stovetop';
  const isM2Stovetop = m2 === 'stovetop';
  const isM1StovetopOven = m1 === 'stovetop/oven';
  const isM2StovetopOven = m2 === 'stovetop/oven';
  const isM1StovetopSimmer = m1 === 'stovetop/simmer';
  const isM2StovetopSimmer = m2 === 'stovetop/simmer';

  // Stovetop + Stovetop = conflict (both active)
  if (isM1Stovetop && isM2Stovetop) return true;

  // Stovetop + Stovetop/Simmer = OK (one active, one simmer)
  if ((isM1Stovetop && isM2StovetopSimmer) || (isM2Stovetop && isM1StovetopSimmer)) {
    return false;
  }

  // Stovetop + Stovetop/Oven = OK (oven frees burner)
  if ((isM1Stovetop && isM2StovetopOven) || (isM2Stovetop && isM1StovetopOven)) {
    return false;
  }

  // Stovetop/Simmer + Stovetop/Simmer = OK (both simmer)
  if (isM1StovetopSimmer && isM2StovetopSimmer) return false;

  // Stovetop/Oven + Stovetop/Oven = conflict (same oven)
  if (isM1StovetopOven && isM2StovetopOven) return true;

  // Stovetop/Oven + Stovetop/Simmer = OK
  if ((isM1StovetopOven && isM2StovetopSimmer) || (isM2StovetopOven && isM1StovetopSimmer)) {
    return false;
  }

  // Check for oven conflicts (Stovetop/Oven vs Oven, or Oven vs Oven)
  if (m1.includes('oven') && m2.includes('oven')) {
    return true; // Both need oven
  }

  // Check for other appliance conflicts
  const nonStovetopAppliances = ['air fryer', 'pressure cooker', 'sous vide'];
  for (const appliance of nonStovetopAppliances) {
    if (m1.includes(appliance) && m2.includes(appliance)) {
      return true; // Same appliance
    }
  }

  return false; // No conflict
}

/**
 * Check if adding a new recipe would conflict with already selected recipes
 */
export function wouldConflictWithSelected(newRecipe, selectedRecipes) {
  const newMethod = newRecipe.cookingMethod;
  if (!newMethod) return false;

  return selectedRecipes.some(recipe =>
    methodsConflict(newMethod, recipe.cookingMethod)
  );
}

export function pickCookingMethods(n) {
  // Define method groups that can work concurrently (no conflicts)
  // Now includes 3 stovetop variants for better burner management
  const methodGroups = [
    // Groups with stovetop variants
    ['Stovetop/Oven', 'Air Fryer', 'Pressure Cooker'],      // Stovetop→Oven + hands-off appliances
    ['Stovetop/Oven', 'Air Fryer', 'Sous Vide'],            // Stovetop→Oven + hands-off appliances
    ['Stovetop/Oven', 'Pressure Cooker', 'Sous Vide'],      // Stovetop→Oven + hands-off appliances
    ['Stovetop', 'Stovetop/Simmer', 'Air Fryer'],           // Active + simmer + air fryer
    ['Stovetop', 'Stovetop/Simmer', 'Pressure Cooker'],     // Active + simmer + pressure cooker
    ['Stovetop', 'Stovetop/Simmer', 'Sous Vide'],           // Active + simmer + sous vide
    ['Stovetop', 'Stovetop/Oven', 'Air Fryer'],             // Active + stovetop→oven + air fryer
    ['Stovetop', 'Stovetop/Oven', 'Pressure Cooker'],       // Active + stovetop→oven + pressure
    ['Stovetop', 'Stovetop/Oven', 'Sous Vide'],             // Active + stovetop→oven + sous vide
    ['Stovetop/Simmer', 'Stovetop/Simmer', 'Air Fryer'],    // Two simmers + air fryer
    ['Stovetop/Simmer', 'Stovetop/Oven', 'Pressure Cooker'], // Simmer + stovetop→oven + pressure
    ['Stovetop/Simmer', 'Stovetop/Oven', 'Sous Vide'],      // Simmer + stovetop→oven + sous vide

    // Groups with pure oven (no stovetop/oven to avoid conflict)
    ['Oven', 'Air Fryer', 'Pressure Cooker'],                // Hands-off appliances
    ['Oven', 'Air Fryer', 'Sous Vide'],                      // Hands-off appliances
    ['Oven', 'Pressure Cooker', 'Sous Vide'],                // Hands-off appliances
  ];

  // Pick a random group
  const selectedGroup = methodGroups[Math.floor(Math.random() * methodGroups.length)];

  // Shuffle the selected group
  const pool = [...selectedGroup];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, n);
}

export async function pLimit(fns, limit = 2) {
  const results = Array(fns.length);
  const queue = fns.map((fn, i) => ({ fn, i }));
  async function worker() {
    let task;
    while ((task = queue.shift())) results[task.i] = await task.fn();
  }
  await Promise.all(Array.from({ length: Math.min(limit, fns.length) }, worker));
  return results;
}

async function callOnce(sys, usr, parentSignal, apiKey) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_CONFIG.TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  if (parentSignal) parentSignal.addEventListener('abort', onAbort);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: API_CONFIG.MODEL,
        max_tokens: API_CONFIG.MAX_TOKENS,
        system: sys,
        messages: [{ role: 'user', content: usr }],
      }),
    });
    const d = await res.json();
    if (d.error) throw new Error(d.error.message || 'API error');
    return d.content.map(b => b.text || '').join('');
  } finally {
    clearTimeout(timer);
    if (parentSignal) parentSignal.removeEventListener('abort', onAbort);
  }
}

export async function callClaude(sys, usr, signal, apiKey, tries = API_CONFIG.RETRY_ATTEMPTS) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await callOnce(sys, usr, signal, apiKey); }
    catch (e) {
      if (e.name === 'AbortError') throw e;
      last = e;
      if (i < tries - 1) await new Promise(r => setTimeout(r, API_CONFIG.RETRY_BACKOFF(i)));
    }
  }
  throw new Error('Failed after ' + tries + ' attempts: ' + last.message);
}

export function buildPrompt(num, servings, calories, special, rules, isBatch, cookingMethods = null, allRecipes = null) {
  const auto = [
    '~' + calories + ' cal/serving',
    servings + ' servings',
    isBatch ? 'BATCH COOK recipe — must store/reheat well (soups, stews, curries, casseroles).' : null,
    isBatch ? 'Simple instant-pot, slow cooker, stock pot, or oven dish.' : null,
  ].filter(Boolean);
  const rulesText = auto.concat(isBatch ? [] : (rules || DEFAULT_RULES)).map(r => '- ' + r).join('\n');

  const basePrompt = [
    'Generate ' + num + (isBatch ? ' batch cook' : '') + ' meal recipe' + (num > 1 ? 's' : '') + '. ' + (special || 'Use varied cuisines and proteins.'),
    'Rules:\n' + rulesText,
    'Grocery types: Produce, Protein/Meat, Pantry, Sauce, Spices, Grain, Dairy',
    '\nOutput (TAB between columns):',
    '-----TAB1-----\nRecipeName TAB Cuisine TAB CookingMethod',
    '-----TAB2-----\nType TAB Item TAB Qty TAB RecipeName',
    '-----TAB3-----\nRecipe Name: X\nCuisine: X\nCook Time: X min\nCalories: X\nCooking Method: X',
    'INGREDIENTS (' + servings + ' servings)\nitem amount',
    'OPTIMIZED COOKING WORKFLOW\n0:00 - step\n(blank line between recipes)',
  ];

  // Add cooking method constraints for non-batch recipes
  if (!isBatch && cookingMethods && cookingMethods.length > 0) {
    const methodConstraints = [
      '\nCOOKING METHOD REQUIREMENTS (CRITICAL - MUST FOLLOW EXACTLY):',
      '',
      ...cookingMethods.map((method, i) =>
        `Recipe ${i + 1} Cooking Method: "${method}"`
      ),
      '',
      '⚠️ CRITICAL RULES:',
      '1. Copy the EXACT method name from above into both TAB1 and TAB3',
      '2. Do NOT modify, combine, or add text (no "primarily", "then", etc.)',
      '3. Design recipe to match the cooking method behavior:',
      '   - "Stovetop" = Active cooking, constant attention (stir-fry, sauté, pan-sear) - NO simmering',
      '   - "Stovetop/Simmer" = Active start, then simmer unattended (soups, stews, braises)',
      '   - "Stovetop/Oven" = Sear on stovetop, then finish in oven (sear & roast)',
      '4. If assigned "Stovetop", do NOT create recipes that simmer (no soups/stews)',
      '5. If assigned "Stovetop/Simmer", recipe MUST include simmering step',
      '',
      'TAB1 format: RecipeName TAB Cuisine TAB ' + cookingMethods[0],
      'TAB3 format: Cooking Method: ' + cookingMethods[0],
    ].join('\n');
    basePrompt.splice(3, 0, methodConstraints); // Insert after rules
  }

  return {
    system: 'You are a concise meal planner. Output ONLY the structured data requested. Start immediately with -----TAB1----- with no preamble.',
    user: basePrompt.join('\n'),
  };
}

export function buildConcurrentWorkflowPrompt(recipes, batchRecipes = []) {
  const recipeList = recipes.map((r, i) => {
    const method = r.cookingMethod || 'Unknown';
    const time = r.cookTime || '30 min';
    return `Recipe ${i + 1}: ${r.name}
  Cooking Method: ${method}
  Cook Time: ${time}
  Ingredients: ${(r.ingredients || []).slice(0, 5).map(ing => ing.text).join(', ')}${r.ingredients?.length > 5 ? '...' : ''}`;
  }).join('\n\n');

  const batchList = batchRecipes.length > 0
    ? '\n\nBatch Cook Recipes (PREP ONLY - cooking done later):\n' + batchRecipes.map((r, i) =>
        `Batch ${i + 1}: ${r.name} - ${(r.ingredients || []).slice(0, 3).map(ing => ing.text).join(', ')}`
      ).join('\n')
    : '';

  return {
    system: 'You are an expert meal prep coordinator. Create a clear, actionable concurrent cooking workflow. Be specific and concise.',
    user: [
      'Create a CONCURRENT COOKING WORKFLOW for these recipes:',
      '',
      recipeList + batchList,
      '',
      '---',
      '',
      'IMPORTANT INSTRUCTIONS:',
      '1. Start with PREP PHASE - organize by category (NOT a long list):',
      '   EQUIPMENT SETUP: Preheat ovens, set up sous vide, fill water baths',
      '   PROTEINS: All protein prep (slice, dice, trim)',
      '   VEGETABLES: All vegetable prep (chop, dice, slice)',
      '   MARINADES & SEASONINGS: Mix sauces, season proteins',
      '   PANTRY: Measure grains, open cans, prep pantry items',
      '   - For batch recipes: ONLY include prep, note "for batch"',
      '   - DO NOT include cooking steps in prep (no "cook rice")',
      '',
      '2. Then COOKING PHASE - one section per cooking method:',
      '   - Use EXACT cooking method name from recipe list (including /Oven, /Simmer suffixes)',
      '   - Example: If recipe says "Stovetop/Simmer", write "[Stovetop/Simmer - Recipe Name]"',
      '   - Example: If recipe says "Stovetop/Oven", write "[Stovetop/Oven - Recipe Name]"',
      '   - Only include recipes that use that method',
      '   - Use timestamps (0:00, 0:05, 0:15, etc.)',
      '   - DO NOT include preheat steps in cooking phase (those are in EQUIPMENT SETUP)',
      '',
      '3. End with TOTAL TIME',
      '',
      'STRICT OUTPUT FORMAT (copy exactly):',
      '',
      'PREP PHASE (25 minutes)',
      '',
      'EQUIPMENT SETUP:',
      '- Preheat oven to 375°F',
      '- Set up sous vide water bath to 140°F',
      '',
      'PROTEINS:',
      '- Cut 1.5 lbs chicken into bite-sized pieces (Recipe 1)',
      '- Slice 1.5 lbs beef thinly (Recipe 3)',
      '',
      'VEGETABLES:',
      '- Dice 2 onions (1 for Recipe 1, 1 for Recipe 3)',
      '- Chop 2 bell peppers (Recipe 1)',
      '- Slice 2 cups mushrooms (Recipe 2)',
      '',
      'MARINADES & SEASONINGS:',
      '- Mix Spanish spice blend for chicken (Recipe 1)',
      '- Season beef with salt, pepper, garlic (Recipe 3)',
      '',
      'PANTRY:',
      '- Measure 2 cups lentils (Recipe 2)',
      '- Open canned tomatoes (Recipe 2)',
      '',
      'COOKING PHASE (40 minutes concurrent)',
      '',
      '[Air Fryer - Spanish Chicken]',
      '0:00 - Add chicken to preheated air fryer, cook 22 min',
      '0:27 - Serve over rice',
      '',
      '[Stovetop/Simmer - Lentil Pasta]',
      '0:00 - Heat olive oil in large pot',
      '0:02 - Brown sausage',
      '0:08 - Add lentils, broth, simmer 30 min',
      '',
      'TOTAL TIME: 65 minutes (all recipes complete)',
      '',
      'DO NOT include cooking in prep. DO NOT include extra text. Just the format above.',
    ].join('\n'),
  };
}