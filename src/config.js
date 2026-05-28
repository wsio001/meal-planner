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
  MEALS_PER_WEEK_OPTIONS: [3, 5, 7, 10, 14, 21],
  PEOPLE_OPTIONS: [1, 2, 3, 4, 5, 6],
  NUM_RECIPES_OPTIONS: [2, 3, 4, 5],
  BATCH_RECIPES_OPTIONS: [1, 2, 3, 4],
  BATCH_SERVINGS_OPTIONS: [8, 10, 12, 15, 20],
  STOVETOP_BURNERS_OPTIONS: [1, 2, 3, 4, 5, 6],
};

// Cooking Methods (for recipe variety and concurrent preparation)
// Stovetop variants help manage burner usage:
// - Stovetop/Oven: Starts on stovetop, finishes in oven (frees burner)
// - Stovetop: Active cooking (needs constant attention)
// - Stovetop/Simmer: Active start, then simmers (low maintenance)
export const COOKING_METHODS = [
  'Sous Vide',
  'Oven',
  'Stovetop/Oven',
  'Stovetop',
  'Stovetop/Simmer',
  'Air Fryer',
  'Pressure Cooker'
];

// Default Values
export const DEFAULTS = {
  NUM_RECIPES: 3, // Number of different recipes to generate
  MEALS_PER_WEEK: 7, // Number of meals needed per week
  NUM_PEOPLE: 2, // Number of people eating per meal
  CALORIES: 750,
  IS_BATCH_ENABLED: false,
  NUM_BATCH: 2,
  BATCH_SERVINGS: 15,
  // Equipment Settings
  STOVETOP_BURNERS: 4,
  HAS_OVEN: true,
  HAS_AIR_FRYER: true,
  HAS_PRESSURE_COOKER: true,
  HAS_SOUS_VIDE: true,
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
  SCROLL_TOP_BUTTON: {
    WIDTH: 50,
    HEIGHT: 50,
    BOTTOM: 30,
    RIGHT: 30,
    BORDER_RADIUS: 25,
    FONT_SIZE: 24,
    Z_INDEX: 1000,
    SHADOW_DEFAULT: '0 4px 12px rgba(0,0,0,0.15)',
    SHADOW_HOVER: '0 6px 16px rgba(0,0,0,0.2)',
    SCALE_HOVER: 1.1,
  },
  EMPTY_STATE_EMOJI_SIZE: 40,
};
