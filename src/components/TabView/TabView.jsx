import React, { useState } from 'react';
import { C } from '../../constants';
import { ThisWeekTab } from '../ThisWeekTab/ThisWeekTab';
import { HistoryTab } from '../History/History';
import styles from './TabView.module.css';

export function TabView({
  mealData,
  numDinners,
  numPeople,
  calories,
  customRules,
  batchCookEnabled,
  numBatchCook,
  selectedBatch,
  setSelectedBatch,
  onViewMealPlan,
  onPageChange,
  selectedWeekly,
  setSelectedWeekly,
  apiKey
}) {
  const [page, setPage] = useState('thisweek');

  const handlePageChange = (newPage) => {
    setPage(newPage);
    if (onPageChange) onPageChange(newPage);
  };

  const cssVars = {
    '--accent-color': C.accent,
    '--dim-color': C.dim,
    '--text-color': '#fff'
  };

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

      {page === 'thisweek' && <ThisWeekTab mealData={mealData} />}

      {page === 'history' && (
        <HistoryTab
          numDinners={numDinners}
          numPeople={numPeople}
          calories={calories}
          customRules={customRules}
          batchCookEnabled={batchCookEnabled}
          numBatchCook={numBatchCook}
          selectedBatch={selectedBatch}
          setSelectedBatch={setSelectedBatch}
          onViewMealPlan={onViewMealPlan}
          selectedWeekly={selectedWeekly}
          setSelectedWeekly={setSelectedWeekly}
          apiKey={apiKey}
        />
      )}
    </div>
  );
}
