import React, { useState } from 'react';
import { C } from '../../../constants';
import { SETTINGS_CONFIG } from '../../../config';
import styles from './CalorieInput.module.css';

export const CalorieInput = React.memo(function CalorieInput({ calories, setCalories }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(String(calories));

  function commit() {
    const v = parseInt(temp);
    if (!isNaN(v) && v >= SETTINGS_CONFIG.CALORIE_MIN && v <= SETTINGS_CONFIG.CALORIE_MAX) {
      setCalories(v);
    } else {
      setTemp(String(calories));
    }
    setEditing(false);
  }

  const cssVars = {
    '--muted-color': C.muted,
    '--bg-color': C.bg,
    '--dimmer-color': C.dimmer,
    '--text-color': C.text,
    '--border-color': C.border
  };

  return (
    <div className={styles.calorieContainer} style={cssVars}>
      <label className={styles.calorieLabel}>🔥 Calories / serving</label>
      <div className={styles.calorieInputRow}>
        {editing ? (
          <input
            autoFocus
            type="number"
            value={temp}
            min={SETTINGS_CONFIG.CALORIE_MIN}
            max={SETTINGS_CONFIG.CALORIE_MAX}
            onChange={e => setTemp(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === 'Enter' && commit()}
            className={styles.calorieInput}
          />
        ) : (
          <button
            onClick={() => {
              setTemp(String(calories));
              setEditing(true);
            }}
            className={styles.calorieButton}
          >
            {calories}
          </button>
        )}
        <span className={styles.calorieUnit}>kcal</span>
      </div>
      <div className={styles.caloriePresets}>
        {SETTINGS_CONFIG.CALORIE_PRESETS.map(n => {
          const presetStyle = {
            '--preset-border': calories === n ? C.accent : C.border,
            '--preset-bg': calories === n ? C.accentBg : C.bg,
            '--preset-color': calories === n ? C.accentText : C.dim
          };
          return (
            <button
              key={n}
              onClick={() => {
                setCalories(n);
                setTemp(String(n));
                setEditing(false);
              }}
              className={styles.caloriePreset}
              style={presetStyle}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
});
