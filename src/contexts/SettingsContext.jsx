import React, { createContext, useContext, useState, useCallback } from 'react';
import { DEFAULTS, STORAGE_KEYS } from '../config';
import { RULES_KEY, DEFAULT_RULES } from '../constants';
import { obfuscate, deobfuscate, isObfuscated } from '../utils/encryption';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [storageMode, setStorageMode] = useState('persistent'); // 'persistent' | 'session-only'

  // Initialize settings from localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS_PREFS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Backward compatibility: migrate from old numDinners to new structure
        if (parsed.numDinners !== undefined && parsed.numRecipes === undefined) {
          return {
            numRecipes: parsed.numDinners || DEFAULTS.NUM_RECIPES,
            mealsPerWeek: DEFAULTS.MEALS_PER_WEEK,
            numPeople: parsed.numPeople || DEFAULTS.NUM_PEOPLE,
            calories: parsed.calories || DEFAULTS.CALORIES,
            isBatchEnabled: parsed.isBatchEnabled ?? DEFAULTS.IS_BATCH_ENABLED,
            numBatch: parsed.numBatch || DEFAULTS.NUM_BATCH,
            batchServings: parsed.batchServings || DEFAULTS.BATCH_SERVINGS,
            // Add default equipment
            stovetopBurners: DEFAULTS.STOVETOP_BURNERS,
            hasOven: DEFAULTS.HAS_OVEN,
            hasAirFryer: DEFAULTS.HAS_AIR_FRYER,
            hasPressureCooker: DEFAULTS.HAS_PRESSURE_COOKER,
            hasSousVide: DEFAULTS.HAS_SOUS_VIDE,
          };
        }
        // Ensure equipment fields exist even in newer data
        return {
          ...parsed,
          stovetopBurners: parsed.stovetopBurners ?? DEFAULTS.STOVETOP_BURNERS,
          hasOven: parsed.hasOven ?? DEFAULTS.HAS_OVEN,
          hasAirFryer: parsed.hasAirFryer ?? DEFAULTS.HAS_AIR_FRYER,
          hasPressureCooker: parsed.hasPressureCooker ?? DEFAULTS.HAS_PRESSURE_COOKER,
          hasSousVide: parsed.hasSousVide ?? DEFAULTS.HAS_SOUS_VIDE,
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
      setStorageMode('session-only');
    }
    return {
      numRecipes: DEFAULTS.NUM_RECIPES,
      mealsPerWeek: DEFAULTS.MEALS_PER_WEEK,
      numPeople: DEFAULTS.NUM_PEOPLE,
      calories: DEFAULTS.CALORIES,
      isBatchEnabled: DEFAULTS.IS_BATCH_ENABLED,
      numBatch: DEFAULTS.NUM_BATCH,
      batchServings: DEFAULTS.BATCH_SERVINGS,
      // Equipment
      stovetopBurners: DEFAULTS.STOVETOP_BURNERS,
      hasOven: DEFAULTS.HAS_OVEN,
      hasAirFryer: DEFAULTS.HAS_AIR_FRYER,
      hasPressureCooker: DEFAULTS.HAS_PRESSURE_COOKER,
      hasSousVide: DEFAULTS.HAS_SOUS_VIDE,
    };
  });

  // Initialize API key separately (with decryption)
  const [apiKey, setApiKeyState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS_API_KEY);
      if (!stored) return '';

      // Check if the stored key is already obfuscated
      if (isObfuscated(stored)) {
        return deobfuscate(stored);
      }

      // If it's plain text (legacy), return as-is and it will be encrypted on next save
      return stored;
    } catch (error) {
      console.warn('Failed to load API key from localStorage:', error);
      return '';
    }
  });

  // Initialize custom rules separately
  const [customRules, setCustomRulesState] = useState(() => {
    try {
      const stored = localStorage.getItem(RULES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load custom rules from localStorage:', error);
    }
    return DEFAULT_RULES;
  });

  // Save settings with fallback to session-only mode
  // Returns: { success: true, mode: 'persistent' | 'session-only' }
  const saveSettings = useCallback(async (newSettings) => {
    try {
      // Try to save to localStorage
      localStorage.setItem(STORAGE_KEYS.SETTINGS_PREFS, JSON.stringify(newSettings));
      setSettings(newSettings);
      setStorageMode('persistent');
      return { success: true, mode: 'persistent' };
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('QUOTA_EXCEEDED');
      } else if (error.name === 'SecurityError' || error.name === 'DOMException') {
        // Fall back to session-only mode
        setSettings(newSettings);
        setStorageMode('session-only');
        console.warn('localStorage disabled - settings will not persist after refresh');
        return { success: true, mode: 'session-only' };
      } else {
        throw error;
      }
    }
  }, []);

  // Save API key (with encryption)
  const setApiKey = useCallback(async (newApiKey) => {
    try {
      // Obfuscate the API key before storing
      const obfuscatedKey = newApiKey ? obfuscate(newApiKey) : '';
      localStorage.setItem(STORAGE_KEYS.SETTINGS_API_KEY, obfuscatedKey);
      // Store plain text in state for use
      setApiKeyState(newApiKey);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('QUOTA_EXCEEDED');
      } else if (error.name === 'SecurityError' || error.name === 'DOMException') {
        setApiKeyState(newApiKey);
        setStorageMode('session-only');
      } else {
        throw error;
      }
    }
  }, []);

  // Save custom rules
  const setCustomRules = useCallback(async (newRules) => {
    try {
      localStorage.setItem(RULES_KEY, JSON.stringify(newRules));
      setCustomRulesState(newRules);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('QUOTA_EXCEEDED');
      } else if (error.name === 'SecurityError' || error.name === 'DOMException') {
        setCustomRulesState(newRules);
        setStorageMode('session-only');
      } else {
        throw error;
      }
    }
  }, []);

  // Individual setters for convenience
  const setNumRecipes = useCallback((value) => {
    setSettings(prev => ({ ...prev, numRecipes: value }));
  }, []);

  const setMealsPerWeek = useCallback((value) => {
    setSettings(prev => ({ ...prev, mealsPerWeek: value }));
  }, []);

  const setNumPeople = useCallback((value) => {
    setSettings(prev => ({ ...prev, numPeople: value }));
  }, []);

  const setCalories = useCallback((value) => {
    setSettings(prev => ({ ...prev, calories: value }));
  }, []);

  const setIsBatchEnabled = useCallback((value) => {
    setSettings(prev => ({
      ...prev,
      isBatchEnabled: typeof value === 'function' ? value(prev.isBatchEnabled) : value
    }));
  }, []);

  const setNumBatch = useCallback((value) => {
    setSettings(prev => ({ ...prev, numBatch: value }));
  }, []);

  const setBatchServings = useCallback((value) => {
    setSettings(prev => ({ ...prev, batchServings: value }));
  }, []);

  const setStoretopBurners = useCallback((value) => {
    setSettings(prev => ({ ...prev, stovetopBurners: value }));
  }, []);

  const setHasOven = useCallback((value) => {
    setSettings(prev => ({ ...prev, hasOven: value }));
  }, []);

  const setHasAirFryer = useCallback((value) => {
    setSettings(prev => ({ ...prev, hasAirFryer: value }));
  }, []);

  const setHasPressureCooker = useCallback((value) => {
    setSettings(prev => ({ ...prev, hasPressureCooker: value }));
  }, []);

  const setHasSousVide = useCallback((value) => {
    setSettings(prev => ({ ...prev, hasSousVide: value }));
  }, []);

  const value = {
    // Settings
    ...settings,
    apiKey,
    customRules,
    storageMode,

    // Computed values
    totalServingsNeeded: settings.mealsPerWeek * settings.numPeople,
    servingsPerRecipe: Math.ceil((settings.mealsPerWeek * settings.numPeople) / settings.numRecipes),

    // Setters
    setNumRecipes,
    setMealsPerWeek,
    setNumPeople,
    setCalories,
    setIsBatchEnabled,
    setNumBatch,
    setBatchServings,
    setApiKey,
    setCustomRules,

    // Equipment setters
    setStoretopBurners,
    setHasOven,
    setHasAirFryer,
    setHasPressureCooker,
    setHasSousVide,

    // Save all settings at once
    saveSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
