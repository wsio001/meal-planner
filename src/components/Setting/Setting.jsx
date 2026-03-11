import React from 'react';
import { C } from '../../constants';
import { PickerRow, CalorieInput } from '../ui';
import styles from './Setting.module.css';

export function Setting({
  numDinners,
  setNumDinners,
  numPeople,
  setNumPeople,
  calories,
  setCalories,
  batchEnabled,
  setBatchEnabled,
  numBatch,
  setNumBatch,
  batchServings,
  setBatchServings,
  selectedBatch,
  onClose
}) {
  const toggleContainerClass = `${styles.toggleContainer} ${batchEnabled ? styles.on : styles.off}`;
  const toggleLabelClass = `${styles.toggleLabel} ${batchEnabled ? styles.on : styles.off}`;
  const toggleStatusClass = `${styles.toggleStatus} ${batchEnabled ? styles.on : styles.off}`;
  const toggleTrackClass = `${styles.toggleTrack} ${batchEnabled ? styles.on : styles.off}`;
  const toggleThumbClass = `${styles.toggleThumb} ${batchEnabled ? styles.on : styles.off}`;

  const cssVars = {
    '--teal-color': C.teal,
    '--teal-text': C.tealText,
    '--teal-dark': C.tealDark,
    '--muted-color': C.muted,
    '--dimmer-color': C.dimmer,
    '--accent-color': C.accent
  };

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.settingsHeader}>
        <p className={styles.settingsTitle}>Settings</p>
        {onClose && (
          <button onClick={onClose} className={styles.saveButton} style={cssVars}>
            ✓ Save
          </button>
        )}
      </div>
      <div className={styles.settingsRow}>
        <PickerRow label="🍽️ Dinners / week" value={numDinners} setValue={setNumDinners} options={[2,3,4,5,6,7]} />
        <PickerRow label="👥 People / dinner" value={numPeople} setValue={setNumPeople} options={[1,2,3,4,5,6]} />
        <CalorieInput calories={calories} setCalories={setCalories} />
      </div>
      <div className={styles.settingsDivider}>
        <div className={styles.batchSettings}>
          <div onClick={() => setBatchEnabled(v => !v)} className={toggleContainerClass} style={cssVars}>
            <div>
              <span className={toggleLabelClass}>🍲 Batch Cook</span>
              <span className={toggleStatusClass}>
                {batchEnabled ? 'Enabled' : 'Off — click to enable'}
              </span>
              {batchEnabled && selectedBatch.length > 0 && (
                <span className={styles.toggleBadge}>{selectedBatch.length + ' from history'}</span>
              )}
            </div>
            <div className={toggleTrackClass}>
              <div className={toggleThumbClass} />
            </div>
          </div>
          {batchEnabled && (
            <div className={styles.settingsRow}>
              <PickerRow label="🍲 Batch recipes" value={numBatch} setValue={setNumBatch} options={[1,2,3,4]} ac={C.teal} bg={C.tealBg} tc={C.tealText} />
              <PickerRow label="🥣 Batch servings" value={batchServings} setValue={setBatchServings} options={[8,10,12,15,20]} ac={C.teal} bg={C.tealBg} tc={C.tealText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
