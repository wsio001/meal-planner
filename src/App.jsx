import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C, S, RULES_KEY, RULES_VER, DEFAULT_RULES } from './constants';
import { callClaude, buildPrompt, pickCuisines, chunkArr, pLimit } from './api';
import { parseTabFormat, combineParsed, mergeParsedArray, saveRecipesBatched } from './data';
import { useElapsed, usePersistedState } from './hooks';
import { ErrorBoundary } from './components/ui';
import { TabView } from './components/TabView/TabView';
import { HeaderView } from './components/HeaderView/HeaderView';
import { APIMissingView } from './components/APIMissingView/APIMissingView';
import { LoadingModal } from './components/LoadingModal/LoadingModal';
import { DEFAULTS, STORAGE_KEYS, UI_CONFIG, API_CONFIG } from './config';

function MealPlanner() {
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState([]);
  const [mealData, setMealData] = usePersistedState(STORAGE_KEYS.CURRENT_MEAL_PLAN, null, 'v1');
  const [error, setError] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedWeekly, setSelectedWeekly] = useState([]);

  const [apiKey, setApiKey, apiKeyLoaded] = usePersistedState(STORAGE_KEYS.SETTINGS_API_KEY, '', 'v1');

  const [prefs, setPrefs, prefsLoaded] = usePersistedState(STORAGE_KEYS.SETTINGS_PREFS, {
    numDinners: DEFAULTS.NUM_DINNERS,
    numPeople: DEFAULTS.NUM_PEOPLE,
    calories: DEFAULTS.CALORIES,
    isBatchEnabled: DEFAULTS.IS_BATCH_ENABLED,
    numBatch: DEFAULTS.NUM_BATCH,
    batchServings: DEFAULTS.BATCH_SERVINGS,
  }, 'v1');
  const { numDinners, numPeople, calories, isBatchEnabled, numBatch, batchServings } = prefs;

  const setNumDinners    = useCallback(v => setPrefs(p=>({...p,numDinners:v})),    [setPrefs]);
  const setNumPeople     = useCallback(v => setPrefs(p=>({...p,numPeople:v})),     [setPrefs]);
  const setCalories      = useCallback(v => setPrefs(p=>({...p,calories:v})),      [setPrefs]);
  const setIsBatchEnabled  = useCallback(v => setPrefs(p=>({...p,isBatchEnabled:typeof v==='function'?v(p.isBatchEnabled):v})), [setPrefs]);
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
      setShowScrollTop(window.scrollY > UI_CONFIG.SCROLL_THRESHOLD);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function generate(special, skipLoadingModal = false) {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    setLoading(true);
    setShowLoadingModal(!skipLoadingModal);
    setError('');
    setMealData(null);
    const batchNeed = isBatchEnabled ? Math.max(0, numBatch-selectedBatch.length) : 0;
    const needToGenerate = Math.max(0, numDinners - selectedWeekly.length);
    const totalSlots = needToGenerate + batchNeed;
    setProgress(Array(totalSlots).fill(false));
    setStage(needToGenerate === 0 ? 'Loading meals...' : 'Generating recipes...');
    try {
      const cuisines = pickCuisines(needToGenerate);
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
          return callClaude(p.system, p.user, signal, apiKey).then(parseTabFormat).then(parsed => {
            chunk.forEach((_,j) => {
              const idx=baseIdx+j;
              setProgress(prev=>{ const n=[...prev]; if(idx<n.length) n[idx]=true; return n; });
            });
            return parsed;
          });
        };
      });

      const batchFn = batchNeed>0
        ? () => callClaude(...Object.values(buildPrompt(batchNeed,batchServings,calories,userSpecial,customRules,true)),signal,apiKey)
            .then(parseTabFormat).then(parsed => {
              (parsed.recipes||[]).forEach((_,i)=>setProgress(prev=>{ const n=[...prev]; n[numDinners+i]=true; return n; }));
              return parsed;
            })
        : () => Promise.resolve({recipes:[],grocery:[],iphoneNotes:{}});

      const [bParsed,...weeklyResults] = await pLimit([batchFn,...weeklyFns], API_CONFIG.MAX_CONCURRENT_REQUESTS);

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
            return callClaude(p.system, p.user, signal, apiKey).then(parseTabFormat).then(r => {
              setProgress(prev=>{ const n=[...prev]; if(slotIdx<n.length) n[slotIdx]=true; return n; });
              return r;
            });
          });
        });
      });
      if (shortfallFns.length>0) {
        setStage('Filling '+shortfallFns.length+' missing recipe(s)...');
        const extras = await pLimit(shortfallFns, API_CONFIG.MAX_CONCURRENT_REQUESTS);
        weeklyResults.push(...extras);
      }

      const wParsed = mergeParsedArray(weeklyResults);
      setStage('Organizing...');
      setProgress(Array(totalSlots).fill(true));

      // Combine newly generated recipes with selected weekly recipes
      const allWeeklyRecipes = [...selectedWeekly, ...(wParsed.recipes || [])];
      const combinedWeekly = {
        recipes: allWeeklyRecipes,
        grocery: wParsed.grocery || [],
        iphoneNotes: wParsed.iphoneNotes || {}
      };
      const combined = combineParsed(combinedWeekly, bParsed, isBatchEnabled?selectedBatch:[]);

      await saveRecipesBatched(
        combined.recipes.filter(r=>!r.isBatchCook&&!selectedWeekly.some(s=>s.name===r.name)),
        combined.recipes.filter(r=>r.isBatchCook&&!selectedBatch.some(s=>s.name===r.name))
      );

      // Add delay before closing modal and showing results (skip if no loading modal)
      if (!skipLoadingModal) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      setMealData(combined);
      setShowLoadingModal(false);
    } catch(e) {
      if(e.name!=='AbortError') {
        setError('Something went wrong: '+e.message);
        setShowLoadingModal(false);
      }
    }
    setLoading(false); setStage('');
  }

  const handleViewHistoryMeal = useCallback((mealPlan) => {
    setMealData(mealPlan);
  }, [setMealData]);

  const handleRecreate = useCallback(async () => {
    // Special case: if needFill = 0 (all meals are reused), skip loading modal
    const needFill = numDinners - selectedWeekly.length;
    if (needFill === 0) {
      // Fast retrieval - no loading modal needed
      await generate('', true);
    } else {
      // Normal generation with loading modal
      await generate('', false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numDinners, selectedWeekly.length]);

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
          isBatchEnabled={isBatchEnabled}
          setIsBatchEnabled={setIsBatchEnabled}
          numBatch={numBatch}
          setNumBatch={setNumBatch}
          batchServings={batchServings}
          setBatchServings={setBatchServings}
          selectedBatch={selectedBatch}
          apiKey={apiKey}
          setApiKey={setApiKey}
        />

        {!apiKey ? (
          <APIMissingView />
        ) : (
          <TabView
            mealData={mealData}
            numDinners={numDinners}
            numPeople={numPeople}
            calories={calories}
            customRules={customRules}
            batchCookEnabled={isBatchEnabled}
            numBatchCook={numBatch}
            selectedBatch={selectedBatch}
            setSelectedBatch={setSelectedBatch}
            selectedWeekly={selectedWeekly}
            setSelectedWeekly={setSelectedWeekly}
            apiKey={apiKey}
            onGenerate={generate}
            onRecreate={handleRecreate}
            loading={loading}
            error={error}
            setCustomRules={setCustomRules}
            rulesLoaded={rulesLoaded}
            isBatchEnabled={isBatchEnabled}
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

      <LoadingModal
        isOpen={showLoadingModal}
        stage={stage}
        elapsed={elapsed}
        progress={progress}
        numDinners={numDinners}
      />
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><MealPlanner /></ErrorBoundary>;
}