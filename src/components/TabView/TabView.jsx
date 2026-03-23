import React, { useState, useMemo } from 'react';
import { C } from '../../constants';
import { ThisWeekTab } from '../ThisWeekTab/ThisWeekTab';
import { HistoryTab } from '../History/History';
import { PromptView } from '../PromptView/PromptView';
import { RecreateRecipesView } from '../RecreateRecipesView/RecreateRecipesView';
import { useRecipeHistory } from '../../contexts/RecipeHistoryContext';
import styles from './TabView.module.css';

export function TabView({
  mealData,
  numDinners,
  numPeople,
  calories,
  customRules,
  batchCookEnabled,
  numBatchCook,
  apiKey,
  // Props for generation
  onGenerate,
  onRecreate,
  loading,
  error,
  setCustomRules,
  rulesLoaded,
  isBatchEnabled,
  currentTab,
  onTabChange
}) {
  // Use recipe history from context
  const { selectedWeekly } = useRecipeHistory();
  const page = currentTab || 'thisweek';

  const handlePageChange = (newPage) => {
    if (onTabChange) {
      onTabChange(newPage);
    }
  };

  const handleViewMealPlan = (mealPlan) => {
    // When viewing a meal plan from history, switch to This Week tab
    if (onTabChange) {
      onTabChange('thisweek');
    }
  };

  const cssVars = useMemo(() => ({
    '--accent-color': C.accent,
    '--dim-color': C.dim,
    '--text-color': '#fff'
  }), []);

  return (
    <div>
      <div className={styles.navBar}>
        {[['thisweek', '📅 This Week'], ['history', '🕘 History']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => handlePageChange(k)}
            className={`${styles.navButton} ${page === k ? styles.active : ''}`}
            style={cssVars}
          >
            {l}
          </button>
        ))}
      </div>

      {page === 'thisweek' && (
        <>
          <PromptView
            onGenerate={onGenerate}
            loading={loading}
            error={error}
            customRules={customRules}
            setCustomRules={setCustomRules}
            numPeople={numPeople}
            calories={calories}
            rulesLoaded={rulesLoaded}
            isBatchEnabled={isBatchEnabled}
          />
          <ThisWeekTab mealData={mealData} />
        </>
      )}

      {page === 'history' && (
        <>
          <RecreateRecipesView
            selectedCount={selectedWeekly.length}
            numDinners={numDinners}
            onRecreate={onRecreate}
            disabled={loading}
            customRules={customRules}
            setCustomRules={setCustomRules}
            numPeople={numPeople}
            calories={calories}
            rulesLoaded={rulesLoaded}
          />
          <HistoryTab
            numDinners={numDinners}
            numPeople={numPeople}
            calories={calories}
            customRules={customRules}
            batchCookEnabled={batchCookEnabled}
            numBatchCook={numBatchCook}
            onViewMealPlan={handleViewMealPlan}
            apiKey={apiKey}
          />
        </>
      )}
    </div>
  );
}
