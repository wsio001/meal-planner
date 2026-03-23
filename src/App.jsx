import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C, S } from './constants';
import { callClaude, buildPrompt, pickCuisines, chunkArr, pLimit } from './api';
import { parseTabFormat, combineParsed, mergeParsedArray, saveRecipesBatched } from './data';
import { useElapsed, usePersistedState } from './hooks';
import { ErrorBoundary } from './components/ui';
import { TabView } from './components/TabView/TabView';
import { HeaderView } from './components/HeaderView/HeaderView';
import { APIMissingView } from './components/APIMissingView/APIMissingView';
import { LoadingModal } from './components/LoadingModal/LoadingModal';
import { SessionBanner } from './components/SessionBanner/SessionBanner';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { ToastProvider, useToast } from './components/Toast/ToastContainer';
import { STORAGE_KEYS, UI_CONFIG, API_CONFIG } from './config';

function MealPlanner() {
  const { showToast } = useToast();

  // Use settings from context
  const {
    numDinners,
    numPeople,
    calories,
    isBatchEnabled,
    numBatch,
    batchServings,
    apiKey,
    customRules,
    setCustomRules,
    storageMode
  } = useSettings();

  // Component-specific state (not settings)
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState([]);
  const [mealData, setMealData] = usePersistedState(STORAGE_KEYS.CURRENT_MEAL_PLAN, null, 'v1');
  const [error, setError] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedWeekly, setSelectedWeekly] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState([]);
  const [currentTab, setCurrentTab] = useState('thisweek');
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

      // Set meal data - modal will auto-close after showing success animation
      setMealData(combined);

      // If we skipped loading modal, close it immediately
      if (skipLoadingModal) {
        setShowLoadingModal(false);
      }
      // Otherwise, modal will close itself after 1s success animation
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

  const handleLoadingComplete = useCallback(() => {
    setShowLoadingModal(false);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={S.wrap}>
      <div style={S.inner}>
        {storageMode === 'session-only' && <SessionBanner />}

        <HeaderView
          selectedBatch={selectedBatch}
          onNavigateToHistory={() => setCurrentTab('history')}
        />

        {!apiKey ? (
          <APIMissingView />
        ) : (
          <TabView
            mealData={mealData}
            selectedBatch={selectedBatch}
            setSelectedBatch={setSelectedBatch}
            selectedWeekly={selectedWeekly}
            setSelectedWeekly={setSelectedWeekly}
            onGenerate={generate}
            onRecreate={handleRecreate}
            loading={loading}
            error={error}
            currentTab={currentTab}
            onTabChange={setCurrentTab}
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
        onComplete={handleLoadingComplete}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SettingsProvider>
          <MealPlanner />
        </SettingsProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}