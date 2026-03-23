import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { C } from '../../constants';
import { useSettings } from '../../contexts/SettingsContext';
import { SaveStateOverlay } from '../SaveStateOverlay/SaveStateOverlay';
import { ApiKeySection } from './ApiKeySection';
import { SettingsForm } from './SettingsForm';
import { BatchCookToggle } from './BatchCookToggle';
import styles from './Setting.module.css';

export function Setting({ selectedBatch, onClose, onGoToHistory }) {
  // Get settings from context
  const {
    numDinners,
    numPeople,
    calories,
    isBatchEnabled,
    numBatch,
    batchServings,
    apiKey,
    saveSettings,
    setApiKey
  } = useSettings();

  // Local state for settings (not saved until Save button is clicked)
  const [localNumDinners, setLocalNumDinners] = useState(numDinners);
  const [localNumPeople, setLocalNumPeople] = useState(numPeople);
  const [localCalories, setLocalCalories] = useState(calories);
  const [localIsBatchEnabled, setLocalIsBatchEnabled] = useState(isBatchEnabled);
  const [localNumBatch, setLocalNumBatch] = useState(numBatch);
  const [localBatchServings, setLocalBatchServings] = useState(batchServings);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [apiKeyValidationStatus, setApiKeyValidationStatus] = useState('idle');

  // Save state overlay
  const [saveState, setSaveState] = useState(null); // null | 'saving' | 'success' | 'warning' | 'error'
  const [saveMessage, setSaveMessage] = useState('');
  const [saveDetail, setSaveDetail] = useState('');

  // Sync local state when context values change (e.g., when reopening Settings)
  useEffect(() => {
    setLocalNumDinners(numDinners);
    setLocalNumPeople(numPeople);
    setLocalCalories(calories);
    setLocalIsBatchEnabled(isBatchEnabled);
    setLocalNumBatch(numBatch);
    setLocalBatchServings(batchServings);
    setLocalApiKey(apiKey);
  }, [numDinners, numPeople, calories, isBatchEnabled, numBatch, batchServings, apiKey]);

  const handleApiKeyChange = useCallback((newKey, validationStatus) => {
    setLocalApiKey(newKey);
    setApiKeyValidationStatus(validationStatus);
  }, []);

  const handleSave = async () => {
    setSaveState('saving');
    setSaveMessage('Saving...');

    try {
      // Minimum 500ms loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Save API key
      await setApiKey(localApiKey);

      // Save settings - returns { success, mode }
      const result = await saveSettings({
        numDinners: localNumDinners,
        numPeople: localNumPeople,
        calories: localCalories,
        isBatchEnabled: localIsBatchEnabled,
        numBatch: localNumBatch,
        batchServings: localBatchServings
      });

      // Check if we're in session-only mode immediately from the result
      if (result.mode === 'session-only') {
        setSaveState('warning');
        setSaveMessage('Settings saved for this session');
        setSaveDetail('Storage is disabled - your settings won\'t persist after closing this page');
        // Don't auto-close, let user acknowledge
      } else {
        setSaveState('success');
        setSaveMessage('Saved');
        setTimeout(() => {
          setSaveState(null);
          if (onClose) {
            onClose();
          }
        }, 1000);
      }

    } catch (error) {
      setSaveState(null);

      let message = 'Could not save settings';
      let detail = 'Something went wrong - please try again';

      if (error.message === 'QUOTA_EXCEEDED') {
        message = 'Could not save settings - storage is full';
        detail = 'You might have too much meal history saved';
      }

      setSaveState('error');
      setSaveMessage(message);
      setSaveDetail(detail);
      // Stay open so user can retry or go to history
    }
  };

  const handleRetry = () => {
    setSaveState(null);
    handleSave();
  };

  const handleGoToHistory = () => {
    setSaveState(null);
    // Switch to history tab first (immediate), then close modal
    if (onGoToHistory) {
      onGoToHistory();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleWarningClose = () => {
    setSaveState(null);
    if (onClose) {
      onClose();
    }
  };

  const cssVars = useMemo(() => ({
    '--teal-color': C.teal,
    '--teal-text': C.tealText,
    '--teal-dark': C.tealDark,
    '--muted-color': C.muted,
    '--dimmer-color': C.dimmer,
    '--accent-color': C.accent
  }), []);

  const isSaveDisabled =
    saveState === 'saving' ||
    apiKeyValidationStatus === 'invalid' ||
    apiKeyValidationStatus === 'checking';

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.settingsHeader}>
        <p className={styles.settingsTitle}>Settings</p>
        {onClose && (
          <button
            onClick={handleSave}
            className={styles.saveButton}
            style={cssVars}
            disabled={isSaveDisabled}
          >
            ✓ Save
          </button>
        )}
      </div>

      <ApiKeySection
        apiKey={localApiKey}
        onApiKeyChange={handleApiKeyChange}
      />

      <SettingsForm
        numDinners={localNumDinners}
        numPeople={localNumPeople}
        calories={localCalories}
        onNumDinnersChange={setLocalNumDinners}
        onNumPeopleChange={setLocalNumPeople}
        onCaloriesChange={setLocalCalories}
      />

      <BatchCookToggle
        enabled={localIsBatchEnabled}
        numBatch={localNumBatch}
        batchServings={localBatchServings}
        selectedBatchCount={selectedBatch.length}
        onToggle={() => setLocalIsBatchEnabled(v => !v)}
        onNumBatchChange={setLocalNumBatch}
        onBatchServingsChange={setLocalBatchServings}
      />

      {/* Save State Overlay */}
      <SaveStateOverlay
        state={saveState}
        message={saveMessage}
        detail={saveDetail}
        onRetry={saveState === 'error' && !saveMessage.includes('storage is full') ? handleRetry : null}
        onGoToHistory={saveState === 'error' && saveMessage.includes('storage is full') ? handleGoToHistory : null}
        onClose={saveState === 'warning' ? handleWarningClose : null}
      />
    </div>
  );
}
