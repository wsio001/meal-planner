import React from 'react';
import { C } from '../../../constants';
import styles from './HistoryMealsCounter.module.css';

export const HistoryMealsCounter = React.memo(function HistoryMealsCounter({ selectedCount, numDinners }) {
  const cssVars = {
    '--muted-color': C.muted,
    '--text-color': C.text,
    '--accent-color': C.accent,
    '--border-color': C.dimmer,
    '--bg-color': C.bg
  };

  return (
    <div className={styles.counterContainer} style={cssVars}>
      <div className={styles.counterDisplay}>
        <span className={styles.counterValue}>{selectedCount}</span>
        <span className={styles.counterSeparator}>/</span>
        <span className={styles.counterTotal}>{numDinners}</span>
        <span className={styles.counterLabel}>meals selected</span>
      </div>
    </div>
  );
});
