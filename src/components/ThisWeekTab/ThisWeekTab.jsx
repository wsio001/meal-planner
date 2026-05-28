import React, { useState, useMemo } from 'react';
import { MealView } from '../MealView/MealView';
import { ConcurrentWorkflow } from '../ConcurrentWorkflow/ConcurrentWorkflow';
import { C } from '../../constants';
import styles from './ThisWeekTab.module.css';

export function ThisWeekTab({ mealData }) {
  const [subTab, setSubTab] = useState('recipes'); // 'recipes' | 'workflow'

  const cssVars = useMemo(() => ({
    '--accent-color': C.accent,
    '--success-color': C.success,
    '--tab-color': C.dim,
    '--border-color': C.border
  }), []);

  if (!mealData) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyIcon}>📭</p>
        <p className={styles.emptyTitle}>No meal plan generated yet.</p>
        <p className={styles.emptySubtitle}>Click "Generate This Week's Meals" above to get started!</p>
      </div>
    );
  }

  return (
    <div className={styles.tabContainer}>
      {/* Sub-tabs */}
      <div className={styles.subTabBar} style={cssVars}>
        <button
          className={subTab === 'recipes' ? styles.subTabActive : styles.subTab}
          onClick={() => setSubTab('recipes')}
        >
          🍽️ Individual Recipes
        </button>
        <button
          className={subTab === 'workflow' ? styles.subTabActive : styles.subTab}
          onClick={() => setSubTab('workflow')}
        >
          ⚡ Concurrent Workflow
        </button>
      </div>

      {/* Content */}
      <div className={styles.subTabContent}>
        {subTab === 'recipes' && <MealView mealData={mealData} />}
        {subTab === 'workflow' && (
          <ConcurrentWorkflow workflowText={mealData.concurrentWorkflow} />
        )}
      </div>
    </div>
  );
}
