import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C, S, RULES_KEY, RULES_VER, DEFAULT_RULES } from './constants';
import { callClaude, buildPrompt, pickCuisines, chunkArr, pLimit } from './api';
import { parseTabFormat, combineParsed, mergeParsedArray, saveRecipesBatched } from './data';
import { useElapsed, usePersistedState } from './hooks';
import { PickerRow, CalorieInput, SpecialRequestInput, ErrorBoundary } from './components/ui';
import { RulesEditor } from './components/RulesEditor';
import { MealView } from './components/MealView';
import { HistoryTab } from './components/History';

function MealPlanner() {
  const [page, setPage] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState([]);
  const [mealData, setMealData] = useState(null);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const [prefs, setPrefs, prefsLoaded] = usePersistedState('settings:prefs', {
    numDinners:3, numPeople:2, calories:750, batchEnabled:false, numBatch:2, batchServings:15,
  }, 'v1');
  const { numDinners, numPeople, calories, batchEnabled, numBatch, batchServings } = prefs;

  const setNumDinners    = useCallback(v => setPrefs(p=>({...p,numDinners:v})),    [setPrefs]);
  const setNumPeople     = useCallback(v => setPrefs(p=>({...p,numPeople:v})),     [setPrefs]);
  const setCalories      = useCallback(v => setPrefs(p=>({...p,calories:v})),      [setPrefs]);
  const setBatchEnabled  = useCallback(v => setPrefs(p=>({...p,batchEnabled:typeof v==='function'?v(p.batchEnabled):v})), [setPrefs]);
  const setNumBatch      = useCallback(v => setPrefs(p=>({...p,numBatch:v})),      [setPrefs]);
  const setBatchServings = useCallback(v => setPrefs(p=>({...p,batchServings:v})), [setPrefs]);

  const [customRules, setCustomRules, rulesLoaded] = usePersistedState(RULES_KEY, DEFAULT_RULES, RULES_VER);
  const [selectedBatch, setSelectedBatch] = useState([]);
  const abortRef = useRef(null);
  const elapsed = useElapsed(loading);

  useEffect(() => { if(selectedBatch.length>numBatch) setSelectedBatch(p=>p.slice(0,numBatch)); }, [numBatch]);
  useEffect(() => () => { if(abortRef.current) abortRef.current.abort(); }, []);

  async function generate(special) {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    setLoading(true); setError(''); setMealData(null);
    const batchNeed = batchEnabled ? Math.max(0, numBatch-selectedBatch.length) : 0;
    const totalSlots = numDinners + batchNeed;
    setProgress(Array(totalSlots).fill(false));
    setStage('Generating recipes...');
    try {
      const cuisines = pickCuisines(numDinners);
      const userSpecial = special.trim();
      const chunks = chunkArr(cuisines, 2);
      let recipeBaseIdx = 0;
      const weeklyFns = chunks.map(chunk => {
        const baseIdx = recipeBaseIdx;
        recipeBaseIdx += chunk.length;
        return () => {
          const cuisineHint = chunk.length===1
            ? 'This recipe MUST be '+chunk[0]+' cuisine.'
            : 'Generate exactly 2 recipes. Recipe 1 MUST be '+chunk[0]+' cuisine. Recipe 2 MUST be '+chunk[1]+' cuisine.';
          const p = buildPrompt(chunk.length, numPeople, calories, (cuisineHint+(userSpecial?' '+userSpecial:'')).trim(), customRules, false);
          return callClaude(p.system, p.user, signal).then(parseTabFormat).then(parsed => {
            chunk.forEach((_,j) => {
              const idx=baseIdx+j;
              setProgress(prev=>{ const n=[...prev]; if(idx<n.length) n[idx]=true; return n; });
            });
            return parsed;
          });
        };
      });

      const batchFn = batchNeed>0
        ? () => callClaude(...Object.values(buildPrompt(batchNeed,batchServings,calories,userSpecial,customRules,true)),signal)
            .then(parseTabFormat).then(parsed => {
              (parsed.recipes||[]).forEach((_,i)=>setProgress(prev=>{ const n=[...prev]; n[numDinners+i]=true; return n; }));
              return parsed;
            })
        : () => Promise.resolve({recipes:[],grocery:[],iphoneNotes:{}});

      const [bParsed,...weeklyResults] = await pLimit([batchFn,...weeklyFns], 3);

      // Shortfall fallback — retry any cuisine the model missed
      const shortfallFns = [];
      weeklyResults.forEach((parsed, ci) => {
        const chunk = chunks[ci];
        const got = (parsed.recipes||[]).length;
        if (got >= chunk.length) return;
        const chunkBase = chunks.slice(0,ci).reduce((s,c)=>s+c.length,0);
        chunk.slice(got).forEach((cuisine,j) => {
          const slotIdx = chunkBase+got+j;
          shortfallFns.push(() => {
            const p = buildPrompt(1, numPeople, calories, ('This recipe MUST be '+cuisine+' cuisine.'+(userSpecial?' '+userSpecial:'')).trim(), customRules, false);
            return callClaude(p.system, p.user, signal).then(parseTabFormat).then(r => {
              setProgress(prev=>{ const n=[...prev]; if(slotIdx<n.length) n[slotIdx]=true; return n; });
              return r;
            });
          });
        });
      });
      if (shortfallFns.length>0) {
        setStage('Filling '+shortfallFns.length+' missing recipe(s)...');
        const extras = await pLimit(shortfallFns, 3);
        weeklyResults.push(...extras);
      }

      const wParsed = mergeParsedArray(weeklyResults);
      setStage('Organizing...');
      setProgress(Array(totalSlots).fill(true));
      const combined = combineParsed(wParsed, bParsed, batchEnabled?selectedBatch:[]);
      setMealData(combined);
      await saveRecipesBatched(
        combined.recipes.filter(r=>!r.isBatchCook),
        combined.recipes.filter(r=>r.isBatchCook&&!selectedBatch.some(s=>s.name===r.name))
      );
    } catch(e) { if(e.name!=='AbortError') setError('Something went wrong: '+e.message); }
    setLoading(false); setStage('');
  }

  const btnLabel = loading?'✨ Generating...':'✨ Generate This Week\'s Meals'+(batchEnabled?' + Batch':'');

  return (
    <div style={S.wrap}>
      <div style={S.inner}>
        <div style={S.hdrRow}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:700, color:'#f8fafc', margin:0 }}>🍽️ Weekly Meal Planner</h1>
            <p style={{ color:C.muted, fontSize:14, margin:'6px 0 0' }}>
              {numDinners+' dinner'+(numDinners>1?'s':'')+' · '+numPeople+' '+(numPeople>1?'people':'person')+' · 🔥 '+calories+' cal'}
              {batchEnabled&&<span style={{ marginLeft:8, color:C.teal }}>{'· 🍲 Batch ×'+numBatch+' ('+batchServings+' srv)'}</span>}
            </p>
          </div>
          <button onClick={()=>setShowSettings(v=>!v)} style={{ background:showSettings?C.border:'transparent', border:'1px solid '+C.border, borderRadius:10, color:C.muted, padding:'8px 14px', fontSize:18, cursor:'pointer' }}>⚙️</button>
        </div>

        {showSettings && (
          <div style={S.settPanel}>
            <p style={S.settTitle}>Settings</p>
            <div style={S.settRow}>
              <PickerRow label="🍽️ Dinners / week" value={numDinners} setValue={setNumDinners} options={[2,3,4,5,6,7]} />
              <PickerRow label="👥 People / dinner" value={numPeople} setValue={setNumPeople} options={[1,2,3,4,5,6]} />
              <CalorieInput calories={calories} setCalories={setCalories} />
            </div>
            <div style={S.settDiv}>
              <p style={S.batchSecTit}>🍲 Batch Cook Settings</p>
              <div style={S.settRow}>
                <PickerRow label="🍲 Batch recipes" value={numBatch} setValue={setNumBatch} options={[1,2,3,4]} ac={C.teal} bg={C.tealBg} tc={C.tealText} />
                <PickerRow label="🥣 Batch servings" value={batchServings} setValue={setBatchServings} options={[8,10,12,15,20]} ac={C.teal} bg={C.tealBg} tc={C.tealText} />
              </div>
            </div>
          </div>
        )}

        <div style={S.navBar}>
          {[['generate','✨ Generate'],['history','🕘 History']].map(([k,l]) => (
            <button key={k} onClick={()=>setPage(k)} style={{ flex:1, padding:10, border:'none', borderRadius:9, background:page===k?C.accent:'transparent', color:page===k?'#fff':C.dim, fontWeight:page===k?700:400, fontSize:14, cursor:'pointer' }}>{l}</button>
          ))}
        </div>

        {page==='generate' && (
          <div>
            <div style={S.genPanel}>
              <div onClick={()=>setBatchEnabled(v=>!v)} style={batchEnabled?S.togOn:S.togOff}>
                <div>
                  <span style={{ fontWeight:700, color:batchEnabled?C.teal:C.muted, fontSize:14 }}>🍲 Batch Cook</span>
                  <span style={{ marginLeft:10, fontSize:12, color:batchEnabled?C.tealText:C.dimmer }}>
                    {batchEnabled?'Generating '+numBatch+' batch recipe'+(numBatch>1?'s':'')+' ('+batchServings+' servings each)':'Off — click to enable'}
                  </span>
                  {batchEnabled&&selectedBatch.length>0&&<span style={{ marginLeft:8, background:C.teal, color:C.tealDark, borderRadius:10, padding:'1px 8px', fontSize:10, fontWeight:700 }}>{selectedBatch.length+' from history'}</span>}
                </div>
                <div style={batchEnabled?S.trackOn:S.trackOff}><div style={batchEnabled?S.thumbOn:S.thumbOff} /></div>
              </div>
              <SpecialRequestInput onSubmit={generate} buttonLabel={btnLabel} disabled={loading} />
              {loading && (
                <div style={{ marginTop:16 }}>
                  <div style={S.pgMeta}>
                    <p style={{ color:C.dim, fontSize:12, margin:0 }}>{stage+' ('+elapsed+'s)'}</p>
                    <div style={S.pgBar}>
                      <div style={{ width:Math.min((elapsed/75)*100,95)+'%', height:'100%', background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:2, transition:'width 1s linear' }} />
                    </div>
                  </div>
                  <div style={S.pgRow}>
                    {progress.map((done,i) => {
                      const isBatch=i>=numDinners;
                      return <div key={i} style={done?(isBatch?S.pgDoneB:S.pgDone):S.pgPend}>{done?'✓':'⏳'}{' '+(isBatch?'Batch '+(i-numDinners+1):'Recipe '+(i+1))}</div>;
                    })}
                  </div>
                </div>
              )}
              {error&&<p style={{ color:C.warn, marginTop:10, fontSize:13 }}>{error}</p>}
              {rulesLoaded&&<RulesEditor customRules={customRules} setCustomRules={setCustomRules} numPeople={numPeople} calories={calories} />}
            </div>
            {mealData&&<MealView mealData={mealData} />}
          </div>
        )}

        {page==='history' && (
          <HistoryTab numDinners={numDinners} numPeople={numPeople} calories={calories} customRules={customRules} batchCookEnabled={batchEnabled} numBatchCook={numBatch} selectedBatch={selectedBatch} setSelectedBatch={setSelectedBatch} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><MealPlanner /></ErrorBoundary>;
}