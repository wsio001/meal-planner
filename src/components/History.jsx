import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { C, S } from '../constants';
import { loadRecipes, saveRecipesBatched, combineParsed, parseTabFormat } from '../data';
import { callClaude, buildPrompt } from '../api';
import { storage } from '../storage';
import { MealView } from './MealView';

const HistoryRow = React.memo(function HistoryRow({ recipe, selected, disabled, onToggle, acColor, acBg, acText, checkDark }) {
  const [hovered, setHovered] = useState(false);
  const rowBg = selected?(acBg||C.accentBg):(hovered&&!disabled?'#162032':'transparent');
  return (
    <tr onClick={()=>!disabled&&onToggle(recipe)}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ borderBottom:'1px solid '+C.bg, cursor:disabled?'not-allowed':'pointer', background:rowBg, opacity:disabled?0.4:1 }}>
      <td style={{ padding:'12px 0 12px 16px' }}>
        <div style={{ width:18, height:18, borderRadius:4, border:'2px solid '+(selected?(acColor||C.accent):C.dimmer), background:selected?(acColor||C.accent):'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {selected && <span style={{ color:checkDark?C.tealDark:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
        </div>
      </td>
      <td style={{ padding:'12px 16px', color:C.text, fontWeight:500 }}>{recipe.name}</td>
      <td style={{ padding:'12px 16px' }}>
        <span style={{ borderRadius:6, padding:'3px 10px', fontSize:12, background:acBg||C.accentBg, color:acText||C.accentText }}>{recipe.cuisine}</span>
      </td>
      <td style={{ padding:'12px 16px', color:C.success, fontSize:13 }}>
        {recipe.caloriesPerServing&&recipe.caloriesPerServing!=='—'?'🔥 '+recipe.caloriesPerServing:<span style={{ color:C.dimmer }}>—</span>}
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
            return <HistoryRow key={recipe.id||recipe.name+'_'+i} recipe={recipe} selected={isSel} disabled={isDis} onToggle={onToggle} acColor={acColor} acBg={acBg} acText={acText} checkDark={checkDark} />;
          })}
        </tbody>
      </table>
    </div>
  );
});

function WeeklyHistorySubTab({ numDinners, numPeople, calories, customRules }) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [view, setView] = useState(null);
  const [filling, setFilling] = useState(false);
  const [fillErr, setFillErr] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => { loadRecipes('recipes:all').then(r=>{ setAll(r); setLoading(false); }); }, []);

  const toggleSel = useCallback(r => {
    setSelected(prev=>prev.some(x=>x.name===r.name)?prev.filter(x=>x.name!==r.name):prev.length<numDinners?[...prev,r]:prev);
  }, [numDinners]);

  const buildPlan = useCallback(async () => {
    const need=numDinners-selected.length;
    if(need===0){setView(combineParsed({recipes:selected.map(r=>({...r,isBatchCook:false})),grocery:[],iphoneNotes:{}},{recipes:[],grocery:[],iphoneNotes:{}},[]));return;}
    setFilling(true);setFillErr('');
    try {
      const sp=selected.length?'Already have: '+selected.map(r=>r.name).join(', ')+'. Pick '+need+' complementary recipe(s).':'';
      const p=buildPrompt(need,numPeople,calories,sp,customRules,false);
      const parsed=parseTabFormat(await callClaude(p.system,p.user,null));
      const newR=(parsed.recipes||[]).map(r=>({...r,isBatchCook:false}));
      await saveRecipesBatched(newR.filter(r=>!selected.some(s=>s.name===r.name)),[]);
      setAll(prev=>{const names=new Set(prev.map(r=>r.name.toLowerCase()));return [...prev,...newR.filter(r=>!names.has(r.name.toLowerCase()))];});
      setView(combineParsed({recipes:[...selected.map(r=>({...r,isBatchCook:false})),...newR],grocery:parsed.grocery||[],iphoneNotes:parsed.iphoneNotes||{}},{recipes:[],grocery:[],iphoneNotes:{}},[]) );
    } catch(e){setFillErr('Failed: '+e.message);}
    setFilling(false);
  }, [numDinners,numPeople,calories,customRules,selected]);

  const clearAll = useCallback(async () => {
    try{await storage.delete('recipes:all');}catch(e){}
    setAll([]);setSelected([]);setView(null);setConfirmClear(false);
  }, []);

  if(loading) return <p style={{textAlign:'center',color:C.dim,padding:40}}>Loading...</p>;
  if(view) return <MealView mealData={view} onBack={()=>setView(null)} backLabel="Back to weekly history" />;
  if(!all.length) return <div style={S.emptyState}><p style={{fontSize:40}}>📭</p><p>No past weekly recipes yet.</p></div>;

  return (
    <div>
      <div style={S.histBar}>
        <div>
          <span style={{color:C.muted,fontSize:13}}>{'Select up to '+numDinners+' recipes'}</span>
          <span style={{marginLeft:10,background:C.accentBg,color:C.accentText,borderRadius:20,padding:'2px 10px',fontSize:12,fontWeight:700}}>{selected.length+' / '+numDinners}</span>
        </div>
        <div style={S.histBarBtns}>
          {selected.length>0&&<button onClick={()=>setSelected([])} style={{background:'transparent',border:'1px solid '+C.dimmer,borderRadius:8,color:C.muted,padding:'6px 12px',fontSize:12,cursor:'pointer'}}>Clear</button>}
          {selected.length>0&&<button onClick={buildPlan} disabled={filling} style={{background:filling?C.border:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:8,color:'#fff',padding:'8px 20px',fontSize:13,fontWeight:700,cursor:filling?'not-allowed':'pointer'}}>{filling?'⏳ Generating...':selected.length===numDinners?'✨ View Meal Plan':'✨ Fill '+(numDinners-selected.length)+' with AI'}</button>}
          {confirmClear
            ?<div style={S.confirmRow}><span style={{color:C.warn,fontSize:12}}>Sure?</span><button onClick={clearAll} style={{background:C.danger,border:'none',borderRadius:8,color:'#fff',padding:'6px 12px',fontSize:12,cursor:'pointer',fontWeight:700}}>Yes</button><button onClick={()=>setConfirmClear(false)} style={{background:'transparent',border:'1px solid '+C.dimmer,borderRadius:8,color:C.muted,padding:'6px 12px',fontSize:12,cursor:'pointer'}}>Cancel</button></div>
            :<button onClick={()=>setConfirmClear(true)} style={{background:'transparent',border:'1px solid '+C.danger,borderRadius:8,color:C.danger,padding:'6px 12px',fontSize:12,cursor:'pointer'}}>🗑 Clear All</button>}
        </div>
      </div>
      {fillErr&&<p style={{color:C.warn,fontSize:13,marginBottom:12}}>{fillErr}</p>}
      {selected.length>0&&(
        <div style={S.fwb14}>
          {selected.map((r,i)=>(
            <div key={r.id||r.name+'_'+i} style={S.chipW}>
              <span style={{color:C.accent,fontWeight:700}}>{'#'+(i+1)}</span>{' '+r.name}
              <span onClick={()=>toggleSel(r)} style={{cursor:'pointer',color:C.accent,fontWeight:700,marginLeft:2}}>×</span>
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

  if(loading) return <p style={{textAlign:'center',color:C.dim,padding:40}}>Loading...</p>;
  if(!all.length) return (
    <div style={S.emptyState}><p style={{fontSize:40}}>🍲</p><p>No batch cook recipes saved yet.</p>
      <p style={{fontSize:12}}>Enable Batch Cook on the Generate tab to create your first batch recipes.</p>
    </div>
  );
  return (
    <div>
      {!batchCookEnabled
        ?<div style={S.batchOff}>🔒 Enable <strong style={{color:'#d6d3d1'}}>Batch Cook</strong> on the Generate tab to select recipes.</div>
        :<div style={S.batchOnBar}>
          <span style={{color:C.tealText,fontSize:13}}>{'Select up to '+numBatchCook+' batch recipe'+(numBatchCook>1?'s':'')}</span>
          <span style={{background:C.teal,color:C.tealDark,borderRadius:20,padding:'2px 10px',fontSize:12,fontWeight:700}}>{selectedBatch.length+' / '+numBatchCook}</span>
        </div>}
      {batchCookEnabled&&selectedBatch.length>0&&(
        <div style={S.fwb14}>
          {selectedBatch.map((r,i)=>(
            <div key={r.id||r.name+'_'+i} style={S.chipB}>
              <span style={{color:C.teal,fontWeight:700}}>{'#'+(i+1)}</span>{' '+r.name}
              <span onClick={()=>toggleSel(r)} style={{cursor:'pointer',color:C.teal,fontWeight:700,marginLeft:2}}>×</span>
            </div>
          ))}
        </div>
      )}
      <div style={S.clearRow}>
        {confirmClear
          ?<div style={S.confirmRow}><span style={{color:C.warn,fontSize:12}}>Clear all?</span><button onClick={clearAll} style={{background:C.danger,border:'none',borderRadius:8,color:'#fff',padding:'6px 12px',fontSize:12,cursor:'pointer',fontWeight:700}}>Yes</button><button onClick={()=>setConfirmClear(false)} style={{background:'transparent',border:'1px solid '+C.dimmer,borderRadius:8,color:C.muted,padding:'6px 12px',fontSize:12,cursor:'pointer'}}>Cancel</button></div>
          :<button onClick={()=>setConfirmClear(true)} style={{background:'transparent',border:'1px solid '+C.danger,borderRadius:8,color:C.danger,padding:'6px 12px',fontSize:12,cursor:'pointer'}}>🗑 Clear All</button>}
      </div>
      <HistoryTable rows={all} selected={selectedBatch} onToggle={toggleSel} maxSelect={numBatchCook} acColor={C.teal} acBg={C.tealBg} acText={C.tealText} checkDark={true} disabled={!batchCookEnabled} />
    </div>
  );
}

export function HistoryTab({ numDinners, numPeople, calories, customRules, batchCookEnabled, numBatchCook, selectedBatch, setSelectedBatch }) {
  const [sub, setSub] = useState('weekly');
  return (
    <div>
      <div style={S.subTabBar}>
        <button onClick={()=>setSub('weekly')} style={{flex:1,padding:'9px 12px',border:'none',borderRadius:7,background:sub==='weekly'?C.accent:'transparent',color:sub==='weekly'?'#fff':C.dim,fontWeight:sub==='weekly'?700:400,fontSize:13,cursor:'pointer'}}>📅 Weekly</button>
        <button onClick={()=>setSub('batch')} style={{flex:1,padding:'9px 12px',border:'none',borderRadius:7,background:sub==='batch'?C.teal:'transparent',color:sub==='batch'?C.tealDark:C.dim,fontWeight:sub==='batch'?700:400,fontSize:13,cursor:'pointer'}}>
          {'🍲 Batch Cook'}
          {batchCookEnabled&&selectedBatch.length>0&&<span style={{marginLeft:6,background:sub==='batch'?C.tealDark:C.teal,color:sub==='batch'?C.teal:C.tealDark,borderRadius:10,padding:'1px 6px',fontSize:10,fontWeight:700}}>{selectedBatch.length}</span>}
        </button>
      </div>
      {sub==='weekly'&&<WeeklyHistorySubTab numDinners={numDinners} numPeople={numPeople} calories={calories} customRules={customRules} />}
      {sub==='batch' &&<BatchCookHistorySubTab batchCookEnabled={batchCookEnabled} numBatchCook={numBatchCook} selectedBatch={selectedBatch} setSelectedBatch={setSelectedBatch} />}
    </div>
  );
}