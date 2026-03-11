import React, { useState, useEffect } from 'react';
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
  apiKey,
  setApiKey,
  onClose
}) {
  // Local state for settings (not saved until Save button is clicked)
  const [localNumDinners, setLocalNumDinners] = useState(numDinners);
  const [localNumPeople, setLocalNumPeople] = useState(numPeople);
  const [localCalories, setLocalCalories] = useState(calories);
  const [localBatchEnabled, setLocalBatchEnabled] = useState(batchEnabled);
  const [localNumBatch, setLocalNumBatch] = useState(numBatch);
  const [localBatchServings, setLocalBatchServings] = useState(batchServings);
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  // Sync local state when props change (e.g., when reopening Settings)
  useEffect(() => {
    setLocalNumDinners(numDinners);
    setLocalNumPeople(numPeople);
    setLocalCalories(calories);
    setLocalBatchEnabled(batchEnabled);
    setLocalNumBatch(numBatch);
    setLocalBatchServings(batchServings);
    setLocalApiKey(apiKey);
  }, [numDinners, numPeople, calories, batchEnabled, numBatch, batchServings, apiKey]);

  const handleSave = () => {
    setNumDinners(localNumDinners);
    setNumPeople(localNumPeople);
    setCalories(localCalories);
    setBatchEnabled(localBatchEnabled);
    setNumBatch(localNumBatch);
    setBatchServings(localBatchServings);
    setApiKey(localApiKey);
    if (onClose) {
      onClose();
    }
  };

  const toggleContainerClass = `${styles.toggleContainer} ${localBatchEnabled ? styles.on : styles.off}`;
  const toggleLabelClass = `${styles.toggleLabel} ${localBatchEnabled ? styles.on : styles.off}`;
  const toggleStatusClass = `${styles.toggleStatus} ${localBatchEnabled ? styles.on : styles.off}`;
  const toggleTrackClass = `${styles.toggleTrack} ${localBatchEnabled ? styles.on : styles.off}`;
  const toggleThumbClass = `${styles.toggleThumb} ${localBatchEnabled ? styles.on : styles.off}`;

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
          <button onClick={handleSave} className={styles.saveButton} style={cssVars}>
            ✓ Save
          </button>
        )}
      </div>

      {/* API Key Section */}
      <div className={styles.apiKeySection}>
        <label className={styles.apiKeyLabel}>🔑 Anthropic API Key</label>
        <input
          type="password"
          value={localApiKey}
          onChange={(e) => setLocalApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className={styles.apiKeyInput}
        />
        <p className={styles.apiKeyHint}>
          Your API key is stored locally and never sent to any server except Anthropic's API.
        </p>
      </div>

      <div className={styles.settingsRow}>
        <PickerRow label="🍽️ Dinners / week" value={localNumDinners} setValue={setLocalNumDinners} options={[2,3,4,5,6,7]} />
        <PickerRow label="👥 People / dinner" value={localNumPeople} setValue={setLocalNumPeople} options={[1,2,3,4,5,6]} />
        <CalorieInput calories={localCalories} setCalories={setLocalCalories} />
      </div>
      <div className={styles.settingsDivider}>
        <div className={styles.batchSettings}>
          <div onClick={() => setLocalBatchEnabled(v => !v)} className={toggleContainerClass} style={cssVars}>
            <div>
              <span className={toggleLabelClass}>🍲 Batch Cook</span>
              <span className={toggleStatusClass}>
                {localBatchEnabled ? 'Enabled' : 'Off — click to enable'}
              </span>
              {localBatchEnabled && selectedBatch.length > 0 && (
                <span className={styles.toggleBadge}>{selectedBatch.length + ' from history'}</span>
              )}
            </div>
            <div className={toggleTrackClass}>
              <div className={toggleThumbClass} />
            </div>
          </div>
          {localBatchEnabled && (
            <div className={styles.settingsRow}>
              <PickerRow label="🍲 Batch recipes" value={localNumBatch} setValue={setLocalNumBatch} options={[1,2,3,4]} ac={C.teal} bg={C.tealBg} tc={C.tealText} />
              <PickerRow label="🥣 Batch servings" value={localBatchServings} setValue={setLocalBatchServings} options={[8,10,12,15,20]} ac={C.teal} bg={C.tealBg} tc={C.tealText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
