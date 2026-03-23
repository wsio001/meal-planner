import React, { useState, useEffect } from 'react';
import { C } from '../../constants';
import { WeeklyHistorySubTab } from './WeeklyHistorySubTab';
import { BatchCookHistorySubTab } from './BatchCookHistorySubTab';
import { useRecipeHistory } from '../../contexts/RecipeHistoryContext';
import styles from './History.module.css';

export function HistoryTab({
  numDinners,
  numPeople,
  calories,
  customRules,
  batchCookEnabled,
  numBatchCook,
  onViewMealPlan,
  apiKey
}) {
  const [sub, setSub] = useState('weekly');

  // Use recipe history from context
  const { selectedWeekly, selectedBatch } = useRecipeHistory();

  // Reset to weekly tab if batch cook is disabled while on batch tab
  useEffect(() => {
    if (!batchCookEnabled && sub === 'batch') {
      setSub('weekly');
    }
  }, [batchCookEnabled, sub]);

  const cssVars = {
    '--tab-color': C.dim,
    '--purple-color': C.purple,
    '--teal-color': C.teal,
    '--teal-text': C.tealText,
    '--badge-bg': C.tealDark,
    '--badge-text': C.teal
  };

  return (
    <div className={styles.historyCard}>
      <div className={styles.tabBar}>
        <button
          onClick={() => setSub('weekly')}
          className={`${styles.tabButton} ${sub === 'weekly' ? styles.active : ''}`}
          style={cssVars}
        >
          📅 Weekly
        </button>
        {batchCookEnabled && (
          <button
            onClick={() => setSub('batch')}
            className={`${styles.tabButton} ${sub === 'batch' ? styles.activeBatch : ''}`}
            style={cssVars}
          >
            {'🍲 Batch Cook'}
            {selectedBatch.length > 0 && (
              <span className={styles.tabBadge}>{selectedBatch.length}</span>
            )}
          </button>
        )}
      </div>
      <div className={styles.tabContent}>
        {sub === 'weekly' && (
          <WeeklyHistorySubTab
            numDinners={numDinners}
            numPeople={numPeople}
            calories={calories}
            customRules={customRules}
            onViewMealPlan={onViewMealPlan}
            apiKey={apiKey}
          />
        )}
        {sub === 'batch' && (
          <BatchCookHistorySubTab
            batchCookEnabled={batchCookEnabled}
            numBatchCook={numBatchCook}
          />
        )}
      </div>
    </div>
  );
}
