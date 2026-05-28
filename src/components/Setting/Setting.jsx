import { useState, useEffect, useMemo, useCallback } from 'react';
import { C } from '../../constants';
import { useSettings } from '../../contexts/SettingsContext';
import { SaveStateOverlay } from '../SaveStateOverlay/SaveStateOverlay';
import { ApiKeySection } from './ApiKeySection';
import { SettingsForm } from './SettingsForm';
import { BatchCookToggle } from './BatchCookToggle';
import { EquipmentSettings } from './EquipmentSettings';
import styles from './Setting.module.css';

export function Setting({ selectedBatch, onClose, onGoToHistory }) {
  // Get settings from context
  const {
    numRecipes,
    mealsPerWeek,
    numPeople,
    calories,
    isBatchEnabled,
    numBatch,
    batchServings,
    stovetopBurners,
    hasOven,
    hasAirFryer,
    hasPressureCooker,
    hasSousVide,
    apiKey,
    saveSettings,
    setApiKey
  } = useSettings();

  // Local state for settings (not saved until Save button is clicked)
  const [localNumRecipes, setLocalNumRecipes] = useState(numRecipes);
  const [localMealsPerWeek, setLocalMealsPerWeek] = useState(mealsPerWeek);
  const [localNumPeople, setLocalNumPeople] = useState(numPeople);
  const [localCalories, setLocalCalories] = useState(calories);
  const [localIsBatchEnabled, setLocalIsBatchEnabled] = useState(isBatchEnabled);
  const [localNumBatch, setLocalNumBatch] = useState(numBatch);
  const [localBatchServings, setLocalBatchServings] = useState(batchServings);
  const [localStoretopBurners, setLocalStoretopBurners] = useState(stovetopBurners);
  const [localHasOven, setLocalHasOven] = useState(hasOven);
  const [localHasAirFryer, setLocalHasAirFryer] = useState(hasAirFryer);
  const [localHasPressureCooker, setLocalHasPressureCooker] = useState(hasPressureCooker);
  const [localHasSousVide, setLocalHasSousVide] = useState(hasSousVide);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [apiKeyValidationStatus, setApiKeyValidationStatus] = useState('idle');

  // Computed values
  const localTotalServings = localMealsPerWeek * localNumPeople;
  const localServingsPerRecipe = Math.ceil(localTotalServings / localNumRecipes);

  // Save state overlay
  const [saveState, setSaveState] = useState(null); // null | 'saving' | 'success' | 'warning' | 'error'
  const [saveMessage, setSaveMessage] = useState('');
  const [saveDetail, setSaveDetail] = useState('');

  // Sync local state when context values change (e.g., when reopening Settings)
  useEffect(() => {
    setLocalNumRecipes(numRecipes);
    setLocalMealsPerWeek(mealsPerWeek);
    setLocalNumPeople(numPeople);
    setLocalCalories(calories);
    setLocalIsBatchEnabled(isBatchEnabled);
    setLocalNumBatch(numBatch);
    setLocalBatchServings(batchServings);
    setLocalStoretopBurners(stovetopBurners);
    setLocalHasOven(hasOven);
    setLocalHasAirFryer(hasAirFryer);
    setLocalHasPressureCooker(hasPressureCooker);
    setLocalHasSousVide(hasSousVide);
    setLocalApiKey(apiKey);
  }, [numRecipes, mealsPerWeek, numPeople, calories, isBatchEnabled, numBatch, batchServings, stovetopBurners, hasOven, hasAirFryer, hasPressureCooker, hasSousVide, apiKey]);

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
        numRecipes: localNumRecipes,
        mealsPerWeek: localMealsPerWeek,
        numPeople: localNumPeople,
        calories: localCalories,
        isBatchEnabled: localIsBatchEnabled,
        numBatch: localNumBatch,
        batchServings: localBatchServings,
        stovetopBurners: localStoretopBurners,
        hasOven: localHasOven,
        hasAirFryer: localHasAirFryer,
        hasPressureCooker: localHasPressureCooker,
        hasSousVide: localHasSousVide
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
    apiKeyValidationStatus === 'checking' ||
    (localApiKey && apiKeyValidationStatus === 'invalid');

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
        numRecipes={localNumRecipes}
        mealsPerWeek={localMealsPerWeek}
        numPeople={localNumPeople}
        calories={localCalories}
        totalServings={localTotalServings}
        servingsPerRecipe={localServingsPerRecipe}
        onNumRecipesChange={setLocalNumRecipes}
        onMealsPerWeekChange={setLocalMealsPerWeek}
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

      <EquipmentSettings
        stovetopBurners={localStoretopBurners}
        hasOven={localHasOven}
        hasAirFryer={localHasAirFryer}
        hasPressureCooker={localHasPressureCooker}
        hasSousVide={localHasSousVide}
        onStoretopBurnersChange={setLocalStoretopBurners}
        onHasOvenChange={setLocalHasOven}
        onHasAirFryerChange={setLocalHasAirFryer}
        onHasPressureCookerChange={setLocalHasPressureCooker}
        onHasSousVideChange={setLocalHasSousVide}
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
