import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C, S, RULES_KEY, RULES_VER, DEFAULT_RULES } from './constants';
import { callClaude, buildPrompt, pickCuisines, chunkArr, pLimit } from './api';
import { parseTabFormat, combineParsed, mergeParsedArray, saveRecipesBatched } from './data';
import { useElapsed, usePersistedState } from './hooks';
import { ErrorBoundary } from './components/ui/ui';
import { MealView } from './components/MealView/MealView';
import { HistoryTab } from './components/History/History';
import { HeaderView } from './components/HeaderView/HeaderView';
import { PromptView } from './components/PromptView/PromptView';

function MealPlanner() {
  const [page, setPage] = useState('thisweek');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState([]);
  const [mealData, setMealData] = usePersistedState('currentMealPlan', null, 'v1');
  const [error, setError] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleViewHistoryMeal = useCallback((mealPlan) => {
    setMealData(mealPlan);
    setPage('thisweek');
  }, [setMealData]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={S.wrap}>
      <div style={S.inner}>
        <HeaderView
          numDinners={numDinners}
          setNumDinners={setNumDinners}
          numPeople={numPeople}
          setNumPeople={setNumPeople}
          calories={calories}
          setCalories={setCalories}
          batchEnabled={batchEnabled}
          setBatchEnabled={setBatchEnabled}
          numBatch={numBatch}
          setNumBatch={setNumBatch}
          batchServings={batchServings}
          setBatchServings={setBatchServings}
          selectedBatch={selectedBatch}
        />

        {/* Generate controls - always visible */}
        <PromptView
          onGenerate={generate}
          buttonLabel={btnLabel}
          loading={loading}
          stage={stage}
          elapsed={elapsed}
          progress={progress}
          numDinners={numDinners}
          error={error}
          customRules={customRules}
          setCustomRules={setCustomRules}
          numPeople={numPeople}
          calories={calories}
          rulesLoaded={rulesLoaded}
        />

        {/* Tab navigation */}
        <div style={S.navBar}>
          {[['thisweek','📅 This Week'],['history','🕘 History']].map(([k,l]) => (
            <button key={k} onClick={()=>setPage(k)} style={{ flex:1, padding:10, border:'none', borderRadius:9, background:page===k?C.accent:'transparent', color:page===k?'#fff':C.dim, fontWeight:page===k?700:400, fontSize:20, cursor:'pointer' }}>{l}</button>
          ))}
        </div>

        {page==='thisweek' && (
          <div>
            {mealData ? <MealView mealData={mealData} /> : (
              <div style={{ textAlign:'center', padding:'60px 20px', color:C.dim }}>
                <p style={{ fontSize:40, margin:0 }}>📭</p>
                <p style={{ fontSize:16, marginTop:10 }}>No meal plan generated yet.</p>
                <p style={{ fontSize:13, color:C.dimmer, marginTop:4 }}>Click "Generate This Week's Meals" above to get started!</p>
              </div>
            )}
          </div>
        )}

        {page==='history' && (
          <HistoryTab
            numDinners={numDinners}
            numPeople={numPeople}
            calories={calories}
            customRules={customRules}
            batchCookEnabled={batchEnabled}
            numBatchCook={numBatch}
            selectedBatch={selectedBatch}
            setSelectedBatch={setSelectedBatch}
            onViewMealPlan={handleViewHistoryMeal}
          />
        )}
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '50px',
            height: '50px',
            borderRadius: '25px',
            border: 'none',
            background: C.accent,
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><MealPlanner /></ErrorBoundary>;
}