import { CUISINES, DEFAULT_RULES } from './constants';

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
  const timer = setTimeout(() => ctrl.abort(), 90000);
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
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

export async function callClaude(sys, usr, signal, apiKey, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await callOnce(sys, usr, signal, apiKey); }
    catch (e) {
      if (e.name === 'AbortError') throw e;
      last = e;
      if (i < tries - 1) await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Failed after ' + tries + ' attempts: ' + last.message);
}

export function buildPrompt(num, servings, calories, special, rules, isBatch) {
  const auto = [
    '~' + calories + ' cal/serving',
    servings + ' servings',
    isBatch ? 'BATCH COOK recipe — must store/reheat well (soups, stews, curries, casseroles).' : null,
    isBatch ? 'Simple instant-pot, slow cooker, stock pot, or oven dish.' : null,
  ].filter(Boolean);
  const rulesText = auto.concat(isBatch ? [] : (rules || DEFAULT_RULES)).map(r => '- ' + r).join('\n');
  return {
    system: 'You are a concise meal planner. Output ONLY the structured data requested. Start immediately with -----TAB1----- with no preamble.',
    user: [
      'Generate ' + num + (isBatch ? ' batch cook' : '') + ' dinner recipe' + (num > 1 ? 's' : '') + '. ' + (special || 'Use varied cuisines and proteins.'),
      'Rules:\n' + rulesText,
      'Grocery types: Produce, Protein/Meat, Pantry, Sauce, Spices, Grain, Dairy',
      '\nOutput (TAB between columns):',
      '-----TAB1-----\nRecipeName TAB Cuisine',
      '-----TAB2-----\nType TAB Item TAB Qty TAB RecipeName',
      '-----TAB3-----\nRecipe Name: X\nCuisine: X\nCook Time: X min\nCalories: X',
      'INGREDIENTS (' + servings + ' servings)\nitem amount',
      'OPTIMIZED COOKING WORKFLOW\n0:00 - step\n(blank line between recipes)',
    ].join('\n'),
  };
}