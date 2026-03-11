import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { C, S } from '../../constants';
import { loadRecipes, saveRecipesBatched, combineParsed, parseTabFormat } from '../../data';
import { callClaude, buildPrompt } from '../../api';
import { storage } from '../../storage';
import styles from './History.module.css';

// Convert recipe ingredients to grocery format
function recipesToGrocery(recipes) {
  const grocery = [];
  const iphoneNotes = { Produce: [], 'Protein/Meat': [], Grains: [], Dairy: [], 'Pantry/Spices': [] };

  recipes.forEach(recipe => {
    (recipe.ingredients || []).forEach(ing => {
      // Handle both old format (string) and new format (object with category)
      let ingredientText, type;
      if (typeof ing === 'object' && ing.text) {
        ingredientText = ing.text;
        // Use saved category, fallback to 'Pantry' if missing
        type = ing.category || 'Pantry';
      } else {
        // Old format: plain string - default to 'Pantry'
        ingredientText = String(ing);
        type = 'Pantry';
      }

      // Parse ingredient: try to extract quantity and item
      const match = ingredientText.match(/^([\d\/\.\s¼½¾⅓⅔⅛⅜⅝⅞]+(?:\s*(?:cup|tbsp|tsp|lb|lbs|oz|g|kg|ml|l|can|clove|cloves|bunch|piece|pieces|slice|slices)s?)?\s*)(.+)$/i);
      let qty = '', item = ingredientText;
      if (match) {
        qty = match[1].trim();
        item = match[2].trim();
      }
      grocery.push([type, item, qty, recipe.name]);

      // Add to iPhone notes
      const entry = item + (qty ? ' - ' + qty : '');
      if (type === 'Produce') iphoneNotes.Produce.push(entry);
      else if (type === 'Protein/Meat') iphoneNotes['Protein/Meat'].push(entry);
      else if (type === 'Grain') iphoneNotes.Grains.push(entry);
      else if (type === 'Dairy') iphoneNotes.Dairy.push(entry);
      else iphoneNotes['Pantry/Spices'].push(item);
    });
  });

  return { grocery, iphoneNotes };
}

const HistoryRow = React.memo(function HistoryRow({ recipe, selected, disabled, onToggle, acColor, acBg, acText, checkDark }) {
  const [hovered, setHovered] = useState(false);
  const rowClasses = [
    styles.historyRow,
    selected && styles.selected,
    hovered && styles.hovered,
    disabled && styles.disabled
  ].filter(Boolean).join(' ');

  const rowStyle = {
    '--row-bg-selected': acBg || C.accentBg,
    '--checkbox-border': selected ? (acColor || C.accent) : C.dimmer,
    '--checkbox-bg': selected ? (acColor || C.accent) : 'transparent',
    '--checkmark-color': checkDark ? C.tealDark : '#fff',
    '--text-color': C.text,
    '--badge-bg': acBg || C.accentBg,
    '--badge-text': acText || C.accentText,
    '--success-color': C.success,
    '--dimmer-color': C.dimmer,
    borderBottom: '1px solid ' + C.bg
  };

  return (
    <tr onClick={()=>!disabled&&onToggle(recipe)}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      className={rowClasses}
      style={rowStyle}>
      <td className={styles.checkboxCell}>
        <div className={styles.checkbox}>
          {selected && <span className={styles.checkmark}>✓</span>}
        </div>
      </td>
      <td className={styles.nameCell}>{recipe.name}</td>
      <td className={styles.cuisineCell}>
        <span className={styles.cuisineBadge}>{recipe.cuisine}</span>
      </td>
      <td className={styles.caloriesCell}>
        {recipe.caloriesPerServing&&recipe.caloriesPerServing!=='—'?'🔥 '+recipe.caloriesPerServing:<span className={styles.caloriesEmpty}>—</span>}
      </td>
    </tr>
  );
});

const HistoryTable = React.memo(function HistoryTable({ rows, selected, onToggle, maxSelect, acColor, acBg, acText, checkDark, disabled }) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const sorted = useMemo(() => rows.slice().sort((a,b) => {
    const av=String(a[sortKey]||'').toLowerCase(), bv=String(b[sortKey]||'').toLowerCase();
    return sortDir==='asc'?av.localeCompare(bv):bv.localeCompare(av);
  }), [rows, sortKey, sortDir]);
  const selectedNames = useMemo(() => new Set(selected.map(r=>r.name)), [selected]);
  function toggleSort(k) { if(sortKey===k) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortKey(k); setSortDir('asc'); } }
  return (
    <div style={acColor===C.teal?S.histWrapT:S.histWrap}>
      <table style={S.histTable}>
        <thead><tr style={S.histHdBg}>
          <th style={{ width:36, padding:12 }} />
          {[['name','Recipe Name'],['cuisine','Cuisine'],['caloriesPerServing','Cal/Serving']].map(([k,l]) => (
            <th key={k} onClick={()=>toggleSort(k)} style={S.thSort}>
              {l}<span style={{ marginLeft:4, color:sortKey===k?(acColor||C.purple):C.dimmer }}>{sortKey===k?(sortDir==='asc'?'↑':'↓'):'↕'}</span>
            </th>
          ))}
        </tr></thead>
        <tbody>
          {sorted.map((recipe,i) => {
            const isSel=selectedNames.has(recipe.name);
            const isDis=disabled||(!isSel&&selected.length>=maxSelect);
            return <HistoryRow 
            key={recipe.id||recipe.name+'_'+i} 
            recipe={recipe} 
            selected={isSel} 
            disabled={isDis} 
            onToggle={onToggle} 
            acColor={acColor} 
            acBg={acBg} 
            acText={acText} 
            checkDark={checkDark} />;
          })}
        </tbody>
      </table>
    </div>
  );
});

function WeeklyHistorySubTab({ numDinners, numPeople, calories, customRules, onViewMealPlan }) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [filling, setFilling] = useState(false);
  const [fillErr, setFillErr] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => { loadRecipes('recipes:all').then(r=>{ setAll(r); setLoading(false); }); }, []);

  const toggleSel = useCallback(r => {
    setSelected(prev=>prev.some(x=>x.name===r.name)?prev.filter(x=>x.name!==r.name):prev.length<numDinners?[...prev,r]:prev);
  }, [numDinners]);

  const buildPlan = useCallback(async () => {
    const need=numDinners-selected.length;
    if(need===0){
      // Generate grocery list from selected recipes
      const { grocery: selectedGrocery, iphoneNotes: selectedNotes } = recipesToGrocery(selected);
      const mealPlan = combineParsed(
        {recipes:selected.map(r=>({...r,isBatchCook:false})),grocery:selectedGrocery,iphoneNotes:selectedNotes},
        {recipes:[],grocery:[],iphoneNotes:{}},
        []
      );
      onViewMealPlan(mealPlan);
      return;
    }
    setFilling(true);setFillErr('');
    try {
      const sp=selected.length?'Already have: '+selected.map(r=>r.name).join(', ')+'. Pick '+need+' complementary recipe(s).':'';
      const p=buildPrompt(need,numPeople,calories,sp,customRules,false);
      const parsed=parseTabFormat(await callClaude(p.system,p.user,null));
      const newR=(parsed.recipes||[]).map(r=>({...r,isBatchCook:false}));
      await saveRecipesBatched(newR.filter(r=>!selected.some(s=>s.name===r.name)),[]);
      setAll(prev=>{const names=new Set(prev.map(r=>r.name.toLowerCase()));return [...prev,...newR.filter(r=>!names.has(r.name.toLowerCase()))];});

      // Generate grocery list from selected recipes and merge with new recipes' grocery
      const { grocery: selectedGrocery, iphoneNotes: selectedNotes } = recipesToGrocery(selected);
      const mealPlan = combineParsed(
        {recipes:[...selected.map(r=>({...r,isBatchCook:false})),...newR],grocery:[...selectedGrocery,...(parsed.grocery||[])],iphoneNotes:selectedNotes},
        {recipes:[],grocery:[],iphoneNotes:parsed.iphoneNotes||{}},
        []
      );
      onViewMealPlan(mealPlan);
    } catch(e){setFillErr('Failed: '+e.message);}
    setFilling(false);
  }, [numDinners,numPeople,calories,customRules,selected,onViewMealPlan]);

  const clearAll = useCallback(async () => {
    try{await storage.delete('recipes:all');}catch(e){}
    setAll([]);setSelected([]);setConfirmClear(false);
  }, []);

  if(loading) return <p className={styles.loading}>Loading...</p>;
  if(!all.length) return <div style={S.emptyState}><p style={{fontSize:40}}>📭</p><p>No past weekly recipes yet.</p></div>;

  const barStyle = {
    '--badge-bg': C.accentBg,
    '--badge-text': C.accentText,
    '--muted-color': C.muted,
    '--dimmer-color': C.dimmer,
    '--danger-color': C.danger,
    '--warn-color': C.warn,
    '--border-color': C.border
  };

  return (
    <div>
      <div className={styles.historyBar} style={barStyle}>
        <div className={styles.historyBarInfo}>
          <span className={styles.historyBarLabel}>{'Select up to '+numDinners+' recipes'}</span>
          <span className={styles.historyBarBadge}>{selected.length+' / '+numDinners}</span>
        </div>
        <div className={styles.historyBarButtons}>
          {selected.length>0&&<button onClick={()=>setSelected([])} className={styles.clearButton}>Clear</button>}
          {selected.length>0&&<button onClick={buildPlan} disabled={filling} className={styles.primaryButton}>{filling?'⏳ Generating...':selected.length===numDinners?'✨ View Meal Plan':'✨ Fill '+(numDinners-selected.length)+' with AI'}</button>}
          {confirmClear
            ?<div className={styles.confirmRow}><span className={styles.confirmText}>Sure?</span><button onClick={clearAll} className={styles.confirmYesButton}>Yes</button><button onClick={()=>setConfirmClear(false)} className={styles.confirmCancelButton}>Cancel</button></div>
            :<button onClick={()=>setConfirmClear(true)} className={styles.deleteButton}>🗑 Clear All</button>}
        </div>
      </div>
      {fillErr&&<p className={styles.errorMessage}>{fillErr}</p>}
      {selected.length>0&&(
        <div className={styles.selectedChips} style={{'--chip-bg': C.accentBg, '--chip-accent': C.accent}}>
          {selected.map((r,i)=>(
            <div key={r.id||r.name+'_'+i} className={styles.chip}>
              <span className={styles.chipNumber}>{'#'+(i+1)}</span>{' '+r.name}
              <span onClick={()=>toggleSel(r)} className={styles.chipClose}>×</span>
            </div>
          ))}
        </div>
      )}
      <HistoryTable rows={all} selected={selected} onToggle={toggleSel} maxSelect={numDinners} acColor={C.accent} acBg={C.accentBg} acText={C.accentText} checkDark={false} disabled={false} />
    </div>
  );
}

function BatchCookHistorySubTab({ batchCookEnabled, numBatchCook, selectedBatch, setSelectedBatch }) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => { loadRecipes('recipes:batch').then(r=>{setAll(r);setLoading(false);}); }, []);

  const toggleSel = useCallback(recipe => {
    if(!batchCookEnabled) return;
    setSelectedBatch(prev=>prev.some(r=>r.name===recipe.name)?prev.filter(r=>r.name!==recipe.name):prev.length<numBatchCook?[...prev,{...recipe,isBatchCook:true}]:prev);
  }, [batchCookEnabled,numBatchCook,setSelectedBatch]);

  const clearAll = useCallback(async () => {
    try{await storage.delete('recipes:batch');}catch(e){}
    setAll([]);setSelectedBatch([]);setConfirmClear(false);
  }, [setSelectedBatch]);

  if(loading) return <p className={styles.loading}>Loading...</p>;
  if(!all.length) return (
    <div style={S.emptyState}><p style={{fontSize:40}}>🍲</p><p>No batch cook recipes saved yet.</p>
      <p style={{fontSize:12}}>Enable Batch Cook on the Generate tab to create your first batch recipes.</p>
    </div>
  );

  const batchStyle = {
    '--bg-darker': C.bgDarker || '#0a0e1a',
    '--border-color': C.border,
    '--muted-color': C.muted,
    '--teal-text': C.tealText,
    '--teal-color': C.teal,
    '--teal-dark': C.tealDark,
    '--chip-accent': C.teal,
    '--chip-bg': C.tealBg,
    '--danger-color': C.danger,
    '--warn-color': C.warn,
    '--dimmer-color': C.dimmer
  };

  return (
    <div style={batchStyle}>
      {!batchCookEnabled
        ?<div className={styles.batchOffBar}>🔒 Enable <strong>Batch Cook</strong> on the Generate tab to select recipes.</div>
        :<div className={styles.batchOnBar}>
          <span className={styles.batchLabel}>{'Select up to '+numBatchCook+' batch recipe'+(numBatchCook>1?'s':'')}</span>
          <span className={styles.batchBadge}>{selectedBatch.length+' / '+numBatchCook}</span>
        </div>}
      {batchCookEnabled&&selectedBatch.length>0&&(
        <div className={styles.selectedChips}>
          {selectedBatch.map((r,i)=>(
            <div key={r.id||r.name+'_'+i} className={styles.chip}>
              <span className={styles.chipNumber}>{'#'+(i+1)}</span>{' '+r.name}
              <span onClick={()=>toggleSel(r)} className={styles.chipClose}>×</span>
            </div>
          ))}
        </div>
      )}
      <div className={styles.clearRowContainer}>
        {confirmClear
          ?<div className={styles.confirmRow}><span className={styles.confirmText}>Clear all?</span><button onClick={clearAll} className={styles.confirmYesButton}>Yes</button><button onClick={()=>setConfirmClear(false)} className={styles.confirmCancelButton}>Cancel</button></div>
          :<button onClick={()=>setConfirmClear(true)} className={styles.deleteButton}>🗑 Clear All</button>}
      </div>
      <HistoryTable rows={all} selected={selectedBatch} onToggle={toggleSel} maxSelect={numBatchCook} acColor={C.teal} acBg={C.tealBg} acText={C.tealText} checkDark={true} disabled={!batchCookEnabled} />
    </div>
  );
}

export function HistoryTab({ numDinners, numPeople, calories, customRules, batchCookEnabled, numBatchCook, selectedBatch, setSelectedBatch, onViewMealPlan }) {
  const [sub, setSub] = useState('weekly');

  const tabStyle = {
    '--dim-color': C.dim,
    '--tab-bg': sub === 'weekly' ? C.accent : C.teal
  };

  const weeklyBtnStyle = sub === 'weekly' ? { '--tab-bg': C.accent } : {};
  const batchBtnStyle = sub === 'batch' ? { '--tab-bg': C.teal, color: C.tealDark } : {};

  const badgeStyle = {
    '--badge-bg': sub === 'batch' ? C.tealDark : C.teal,
    '--badge-text': sub === 'batch' ? C.teal : C.tealDark
  };

  return (
    <div>
      <div className={styles.subTabBar} style={tabStyle}>
        <button
          onClick={()=>setSub('weekly')}
          className={`${styles.subTabButton} ${sub==='weekly'?styles.active:''}`}
          style={weeklyBtnStyle}>
          📅 Weekly
        </button>
        <button
          onClick={()=>setSub('batch')}
          className={`${styles.subTabButton} ${sub==='batch'?styles.active:''}`}
          style={batchBtnStyle}>
          {'🍲 Batch Cook'}
          {batchCookEnabled&&selectedBatch.length>0&&<span className={styles.tabBadge} style={badgeStyle}>{selectedBatch.length}</span>}
        </button>
      </div>
      {sub==='weekly'&&<WeeklyHistorySubTab numDinners={numDinners} numPeople={numPeople} calories={calories} customRules={customRules} onViewMealPlan={onViewMealPlan} />}
      {sub==='batch' &&<BatchCookHistorySubTab batchCookEnabled={batchCookEnabled} numBatchCook={numBatchCook} selectedBatch={selectedBatch} setSelectedBatch={setSelectedBatch} />}
    </div>
  );
}