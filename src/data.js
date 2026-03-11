import { storage } from './storage';

export function parseTabFormat(text) {
  const empty = { overview:[], grocery:[], recipes:[], iphoneNotes:{ Produce:[], 'Protein/Meat':[], Grains:[], Dairy:[], 'Pantry/Spices':[] } };
  if (!text) return empty;
  const parts = text.split(/-----TAB[123]-----/);
  if (parts.length < 4) return empty;
  const [, raw1, raw2, raw3] = parts;
  const overview = [];
  raw1.trim().split('\n').forEach(l => { l=l.trim(); if(!l) return; const p=l.split('\t'); if(p.length>=2) overview.push([p[0].trim(),p[1].trim()]); });
  const grocery = [];
  const iph = { Produce:[], 'Protein/Meat':[], Grains:[], Dairy:[], 'Pantry/Spices':[] };
  raw2.trim().split('\n').forEach(l => {
    l=l.trim(); if(!l) return;
    const p=l.split(/\t|  +/);
    if(p.length>=4) {
      const [type,item,qty,...rest]=p.map(s=>s.trim());
      grocery.push([type,item,qty,rest.join(' ')]);
      const entry=item+' - '+qty;
      if(type==='Produce') iph['Produce'].push(entry);
      else if(type==='Protein/Meat') iph['Protein/Meat'].push(entry);
      else if(type==='Grain') iph['Grains'].push(entry);
      else if(type==='Dairy') iph['Dairy'].push(entry);
      else iph['Pantry/Spices'].push(item);
    }
  });
  const recipes = [];
  raw3.trim().split(/\n(?=Recipe Name:)/i).forEach((blk, idx) => {
    if(!blk.trim()) return;
    const r={number:idx+1,name:'',cuisine:'',cookTime:'',caloriesPerServing:0,ingredients:[],workflow:[]};
    let mode='header';
    blk.trim().split('\n').forEach(l => {
      l=l.trim(); if(!l) return;
      if(/^recipe name:/i.test(l))      { r.name=l.replace(/^recipe name:\s*/i,''); return; }
      if(/^cuisine:/i.test(l))          { r.cuisine=l.replace(/^cuisine:\s*/i,''); return; }
      if(/^cook time:/i.test(l))        { r.cookTime=l.replace(/^cook time:\s*/i,''); return; }
      if(/^calories:/i.test(l))         { r.caloriesPerServing=parseInt(l.replace(/^calories:\s*/i,''))||0; return; }
      if(/^INGREDIENTS/i.test(l))       { mode='ingredients'; return; }
      if(/^OPTIMIZED COOKING/i.test(l)) { mode='workflow'; return; }
      if(mode==='ingredients') r.ingredients.push(l);
      else if(mode==='workflow') r.workflow.push(l);
    });
    if(r.name) recipes.push(r);
  });
  return { overview, grocery, recipes, iphoneNotes: iph };
}

export function safeR(r, i, isBatch) {
  const name = (r && r.name) ? r.name : 'Recipe ' + (i + 1);
  return {
    id: name + '_' + i,
    number: (r && r.number) ? r.number : i + 1,
    name,
    cuisine: (r && r.cuisine) ? r.cuisine : 'Unknown',
    cookTime: (r && r.cookTime) ? r.cookTime : '30 mins',
    caloriesPerServing: (r && r.caloriesPerServing) ? r.caloriesPerServing : '—',
    ingredients: (r && Array.isArray(r.ingredients)) ? r.ingredients : [],
    workflow: (r && Array.isArray(r.workflow)) ? r.workflow : [],
    isBatchCook: isBatch || false,
  };
}

export function mergeGrocery(...lists) {
  const seen = {}, result = [];
  lists.flat().forEach(row => {
    if (!Array.isArray(row) || !row[1]) return;
    const [type, item, qty='', rec=''] = row.map(s => String(s||'').trim());
    const key = item.toLowerCase(); if (!key) return;
    if (seen[key]) seen[key][3] += ', ' + rec;
    else { const e=[type,item,qty,rec]; seen[key]=e; result.push(e); }
  });
  return result;
}

export function mergeParsedArray(parsedArr) {
  const noteKeys = ['Produce','Protein/Meat','Grains','Dairy','Pantry/Spices'];
  const iphoneNotes = {};
  noteKeys.forEach(k => iphoneNotes[k] = []);
  const allRecipes = [], allGrocery = [];
  parsedArr.forEach(p => {
    allRecipes.push(...(p.recipes || []));
    allGrocery.push(...(p.grocery || []));
    noteKeys.forEach(k => { if (p.iphoneNotes?.[k]) iphoneNotes[k].push(...p.iphoneNotes[k]); });
  });
  return { recipes: allRecipes, grocery: allGrocery, iphoneNotes };
}

export function combineParsed(wP, bP, pastBatch) {
  const wR    = (wP.recipes  || []).map((r,i) => ({ ...safeR(r,i,false), isBatchCook:false }));
  const pastB = (pastBatch   || []).map((r,i) =>
    (r && r.name && r.ingredients)
      ? { ...r, id: r.id||(r.name+'_past_'+i), isBatchCook:true }
      : { ...safeR(r,i,true), isBatchCook:true }
  );
  const newB  = (bP.recipes  || []).map((r,i) => ({ ...safeR(r,i,true), isBatchCook:true }));
  const all   = [...wR,...pastB,...newB].map((r,i) => ({ ...r, number:i+1 }));
  const grocery = mergeGrocery(wP.grocery||[], bP.grocery||[]);
  const noteKeys = ['Produce','Protein/Meat','Grains','Dairy','Pantry/Spices'];
  const iphoneNotes = {};
  noteKeys.forEach(k => {
    const seen = new Set();
    iphoneNotes[k] = [...(wP.iphoneNotes?.[k]||[]),...(bP.iphoneNotes?.[k]||[])].filter(x => {
      if (!x) return false;
      const key = x.split('-')[0].trim().toLowerCase();
      return seen.has(key) ? false : (seen.add(key), true);
    });
  });
  return { recipes:all, grocery, iphoneNotes, overview:all.map(r=>[r.name,r.cuisine,r.isBatchCook]) };
}

export async function saveRecipesBatched(weekly, batch) {
  async function save(recipes, key) {
    if (!recipes.length) return;
    try {
      let ex = [];
      try { const r = await storage.get(key); if(r) ex=JSON.parse(r.value); } catch(e){}
      const names = new Set(ex.map(r=>r.name.toLowerCase().trim()));
      const news = recipes.filter(r=>!names.has(r.name.toLowerCase().trim()));
      if (news.length) await storage.set(key, JSON.stringify(ex.concat(news)));
    } catch(e) { console.error(e); }
  }
  await Promise.all([save(weekly,'recipes:all'), save(batch,'recipes:batch')]);
}

export async function loadRecipes(key) {
  try { const r = await storage.get(key||'recipes:all'); return r ? JSON.parse(r.value) : []; }
  catch(e) { return []; }
}