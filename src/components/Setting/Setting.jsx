import React, { useState, useEffect, useMemo } from 'react';
import { C } from '../../constants';
import { PickerRow, CalorieInput } from '../ui';
import { SETTINGS_CONFIG } from '../../config';
import styles from './Setting.module.css';

export function Setting({
  numDinners,
  setNumDinners,
  numPeople,
  setNumPeople,
  calories,
  setCalories,
  isBatchEnabled,
  setIsBatchEnabled,
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
  const [localIsBatchEnabled, setLocalIsBatchEnabled] = useState(isBatchEnabled);
  const [localNumBatch, setLocalNumBatch] = useState(numBatch);
  const [localBatchServings, setLocalBatchServings] = useState(batchServings);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(false);

  // Sync local state when props change (e.g., when reopening Settings)
  useEffect(() => {
    setLocalNumDinners(numDinners);
    setLocalNumPeople(numPeople);
    setLocalCalories(calories);
    setLocalIsBatchEnabled(isBatchEnabled);
    setLocalNumBatch(numBatch);
    setLocalBatchServings(batchServings);
    setLocalApiKey(apiKey);
  }, [numDinners, numPeople, calories, isBatchEnabled, numBatch, batchServings, apiKey]);

  const handleSave = () => {
    setNumDinners(localNumDinners);
    setNumPeople(localNumPeople);
    setCalories(localCalories);
    setIsBatchEnabled(localIsBatchEnabled);
    setNumBatch(localNumBatch);
    setBatchServings(localBatchServings);
    setApiKey(localApiKey);

    // Show saved state
    setIsSaved(true);

    // Close modal after delay
    setTimeout(() => {
      setIsSaved(false);
      if (onClose) {
        onClose();
      }
    }, 1500);
  };

  const toggleContainerClass = `${styles.toggleContainer} ${localIsBatchEnabled ? styles.on : styles.off}`;
  const toggleLabelClass = `${styles.toggleLabel} ${localIsBatchEnabled ? styles.on : styles.off}`;
  const toggleStatusClass = `${styles.toggleStatus} ${localIsBatchEnabled ? styles.on : styles.off}`;
  const toggleTrackClass = `${styles.toggleTrack} ${localIsBatchEnabled ? styles.on : styles.off}`;
  const toggleThumbClass = `${styles.toggleThumb} ${localIsBatchEnabled ? styles.on : styles.off}`;

  const cssVars = useMemo(() => ({
    '--teal-color': C.teal,
    '--teal-text': C.tealText,
    '--teal-dark': C.tealDark,
    '--muted-color': C.muted,
    '--dimmer-color': C.dimmer,
    '--accent-color': C.accent
  }), []);

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.settingsHeader}>
        <p className={styles.settingsTitle}>Settings</p>
        {onClose && (
          <button
            onClick={handleSave}
            className={`${styles.saveButton} ${isSaved ? styles.saved : ''}`}
            style={cssVars}
            disabled={isSaved}
          >
            {isSaved ? '✓ Saved' : '✓ Save'}
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
        <PickerRow label="🍽️ Dinners / week" value={localNumDinners} setValue={setLocalNumDinners} options={SETTINGS_CONFIG.DINNERS_OPTIONS} />
        <PickerRow label="👥 People / dinner" value={localNumPeople} setValue={setLocalNumPeople} options={SETTINGS_CONFIG.PEOPLE_OPTIONS} />
        <CalorieInput calories={localCalories} setCalories={setLocalCalories} />
      </div>
      <div className={styles.settingsDivider}>
        <div className={styles.batchSettings}>
          <div onClick={() => setLocalIsBatchEnabled(v => !v)} className={toggleContainerClass} style={cssVars}>
            <div>
              <span className={toggleLabelClass}>🍲 Batch Cook</span>
              <span className={toggleStatusClass}>
                {localIsBatchEnabled ? 'Enabled' : 'Off — click to enable'}
              </span>
              {localIsBatchEnabled && selectedBatch.length > 0 && (
                <span className={styles.toggleBadge}>{selectedBatch.length + ' from history'}</span>
              )}
            </div>
            <div className={toggleTrackClass}>
              <div className={toggleThumbClass} />
            </div>
          </div>
          {localIsBatchEnabled && (
            <div className={styles.settingsRow}>
              <PickerRow label="🍲 Batch recipes" value={localNumBatch} setValue={setLocalNumBatch} options={SETTINGS_CONFIG.BATCH_RECIPES_OPTIONS} ac={C.teal} bg={C.tealBg} tc={C.tealText} />
              <PickerRow label="🥣 Batch servings" value={localBatchServings} setValue={setLocalBatchServings} options={SETTINGS_CONFIG.BATCH_SERVINGS_OPTIONS} ac={C.teal} bg={C.tealBg} tc={C.tealText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
