import React, { useState, useEffect, useMemo } from 'react';
import { C } from '../../constants';
import { PickerRow, CalorieInput } from '../ui';
import { SETTINGS_CONFIG } from '../../config';
import { useSettings } from '../../contexts/SettingsContext';
import { SaveStateOverlay } from '../SaveStateOverlay/SaveStateOverlay';
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
    setApiKey,
    storageMode
  } = useSettings();

  // Local state for settings (not saved until Save button is clicked)
  const [localNumDinners, setLocalNumDinners] = useState(numDinners);
  const [localNumPeople, setLocalNumPeople] = useState(numPeople);
  const [localCalories, setLocalCalories] = useState(calories);
  const [localIsBatchEnabled, setLocalIsBatchEnabled] = useState(isBatchEnabled);
  const [localNumBatch, setLocalNumBatch] = useState(numBatch);
  const [localBatchServings, setLocalBatchServings] = useState(batchServings);
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  // API Key validation state
  const [apiKeyValidation, setApiKeyValidation] = useState({
    status: 'idle', // 'idle' | 'checking' | 'valid' | 'invalid'
    message: ''
  });

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

  // Validate API key with debounce
  useEffect(() => {
    if (!localApiKey || !localApiKey.trim()) {
      setApiKeyValidation({ status: 'idle', message: '' });
      return;
    }

    setApiKeyValidation({ status: 'checking', message: '' });

    const timer = setTimeout(() => {
      if (!localApiKey.startsWith('sk-ant-')) {
        setApiKeyValidation({
          status: 'invalid',
          message: 'Please enter a valid API key'
        });
      } else if (localApiKey.length < 40) {
        setApiKeyValidation({
          status: 'invalid',
          message: 'API key is too short'
        });
      } else {
        setApiKeyValidation({ status: 'valid', message: '' });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localApiKey]);

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
    '--accent-color': C.accent,
    '--valid-color': C.success,
    '--invalid-color': '#fca5a5'
  }), []);

  const isSaveDisabled =
    saveState === 'saving' ||
    apiKeyValidation.status === 'invalid' ||
    apiKeyValidation.status === 'checking';

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

      {/* API Key Section */}
      <div className={styles.apiKeySection}>
        {/* Security Warning */}
        <div className={styles.securityNotice}>
          <div className={styles.noticeHeader}>
            <span className={styles.noticeIcon}>🔒</span>
            <strong>Security Notice</strong>
          </div>
          <ul className={styles.noticeList}>
            <li>Only enter your API key on <strong>{window.location.hostname}</strong></li>
            <li>Never share your API key with anyone</li>
            <li>Your key is stored locally in your browser only</li>
          </ul>
        </div>

        <label className={styles.apiKeyLabel}>🔑 Anthropic API Key</label>
        <input
          type="password"
          value={localApiKey}
          onChange={(e) => setLocalApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className={styles.apiKeyInput}
        />
        {apiKeyValidation.status === 'checking' && (
          <p className={styles.apiKeyValidating} style={cssVars}>
            ⏳ Checking...
          </p>
        )}
        {apiKeyValidation.status === 'valid' && (
          <p className={styles.apiKeyValid} style={cssVars}>
            ✓ Valid API key
          </p>
        )}
        {apiKeyValidation.status === 'invalid' && (
          <p className={styles.apiKeyInvalid} style={cssVars}>
            ✗ {apiKeyValidation.message}
          </p>
        )}
        {apiKeyValidation.status === 'idle' && (
          <p className={styles.apiKeyHint}>
            Your API key is stored locally and never sent to any server except Anthropic's API.
          </p>
        )}
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
