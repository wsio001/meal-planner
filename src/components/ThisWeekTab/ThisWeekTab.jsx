import React from 'react';
import { MealView } from '../MealView/MealView';
import { C } from '../../constants';
import styles from './ThisWeekTab.module.css';

export function ThisWeekTab({ mealData }) {
  if (!mealData) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyIcon}>📭</p>
        <p className={styles.emptyTitle}>No meal plan generated yet.</p>
        <p className={styles.emptySubtitle}>Click "Generate This Week's Meals" above to get started!</p>
      </div>
    );
  }

  return <MealView mealData={mealData} />;
}
