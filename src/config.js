/**
 * Application Configuration
 * Centralized constants and configuration values
 */

// API Configuration
export const API_CONFIG = {
  TIMEOUT_MS: 90000,
  MODEL: 'claude-haiku-4-5-20251001',
  MAX_TOKENS: 2500,
  RETRY_ATTEMPTS: 3,
  RETRY_BACKOFF: (attempt) => Math.pow(2, attempt) * 1000,
  MAX_CONCURRENT_REQUESTS: 3,
};

// UI Configuration
export const UI_CONFIG = {
  SCROLL_THRESHOLD: 300,
  PROGRESS_DENOMINATOR: 75,
  PROGRESS_MAX_PERCENT: 95,
};

// Settings Configuration
export const SETTINGS_CONFIG = {
  CALORIE_MIN: 300,
  CALORIE_MAX: 1500,
  CALORIE_PRESETS: [400, 500, 600, 700, 750, 800],
  DINNERS_OPTIONS: [2, 3, 4, 5, 6, 7],
  PEOPLE_OPTIONS: [1, 2, 3, 4, 5, 6],
  BATCH_RECIPES_OPTIONS: [1, 2, 3, 4],
  BATCH_SERVINGS_OPTIONS: [8, 10, 12, 15, 20],
};

// Default Values
export const DEFAULTS = {
  NUM_DINNERS: 3,
  NUM_PEOPLE: 2,
  CALORIES: 750,
  IS_BATCH_ENABLED: false,
  NUM_BATCH: 2,
  BATCH_SERVINGS: 15,
};

// Storage Keys
export const STORAGE_KEYS = {
  CURRENT_MEAL_PLAN: 'currentMealPlan',
  SETTINGS_PREFS: 'settings:prefs',
  SETTINGS_API_KEY: 'settings:apiKey',
  RECIPES_ALL: 'recipes:all',
  RECIPES_BATCH: 'recipes:batch',
};

// Component Height/Size Constants
export const SIZE_CONFIG = {
  MIN_PANEL_HEIGHT: 400,
  CHIP_MIN_HEIGHT: 38,
  INPUT_MIN_HEIGHT: 45,
};
