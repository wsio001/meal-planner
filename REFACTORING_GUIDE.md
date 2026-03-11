# Refactoring Guide - Priority Implementation Plan

This document outlines the systematic refactoring plan for the meal planner application, organized by priority and estimated effort.

## ✅ COMPLETED

### 1. Created config.js
- **File**: `/src/config.js`
- **Status**: ✅ Done
- **Impact**: Centralizes all magic numbers and configuration

### 2. Updated api.js to use config
- **File**: `/src/api.js`
- **Changes**:
  - `API_CONFIG.TIMEOUT_MS` (was 90000)
  - `API_CONFIG.MODEL` (was 'claude-haiku-4-5-20251001')
  - `API_CONFIG.MAX_TOKENS` (was 2500)
  - `API_CONFIG.RETRY_ATTEMPTS` (was 3)
  - `API_CONFIG.RETRY_BACKOFF(i)` (was Math.pow(2, i) * 1000)
- **Status**: ✅ Done

---

## 🔴 HIGH PRIORITY - Do Next

### 3. Rename batchEnabled → isBatchEnabled (30 min)
**Rationale**: Consistent boolean naming convention

**Files to update**:
1. `/src/config.js` - Line 39: `IS_BATCH_ENABLED: false`
2. `/src/App.jsx`:
   - Line 26: `isBatchEnabled:false`
   - Line 28: `const { ..., isBatchEnabled, ... } = prefs;`
   - Line 33: `const setIsBatchEnabled = useCallback...`
   - Line 42: `if(selectedBatch.length>numBatch)`
   - Line 58: `const batchNeed = isBatchEnabled ? ...`
   - Line 86: `buildPrompt(..., isBatchEnabled)`
   - Lines 160-162, 177-179, 206-207: Props passed to components
3. `/src/components/HeaderView/HeaderView.jsx` - All prop references
4. `/src/components/Setting/Setting.jsx` - All prop and state references
5. `/src/components/PromptView/PromptView.jsx` - Line 20, 26

**Search & Replace**:
```bash
# Find all: batchEnabled
# Replace: isBatchEnabled
```

### 4. Remove HeaderView Duplication (15 min)
**File**: `/src/App.jsx` Lines 153-220

**Current** (duplicated):
```javascript
{!apiKey ? (
  <>
    <HeaderView {...props} />
    <APIMissingView />
  </>
) : (
  <>
    <HeaderView {...props} />  // DUPLICATE!
    {currentPage === 'thisweek' ? ...}
  </>
)}
```

**Fixed**:
```javascript
<HeaderView
  numDinners={numDinners}
  setNumDinners={setNumDinners}
  numPeople={numPeople}
  setNumPeople={setNumPeople}
  calories={calories}
  setCalories={setCalories}
  isBatchEnabled={isBatchEnabled}
  setIsBatchEnabled={setIsBatchEnabled}
  numBatch={numBatch}
  setNumBatch={setNumBatch}
  batchServings={batchServings}
  setBatchServings={setBatchServings}
  selectedBatch={selectedBatch}
  apiKey={apiKey}
  setApiKey={setApiKey}
/>

{!apiKey ? (
  <APIMissingView />
) : (
  <>
    {currentPage === 'thisweek' ? ...}
  </>
)}
```

### 5. Add Accessibility - ARIA Labels (1 hour)

#### 5.1 Scroll to Top Button
**File**: `/src/App.jsx` Line 244
```javascript
// Before:
<button onClick={scrollToTop} style={{...}}>↑</button>

// After:
<button
  onClick={scrollToTop}
  aria-label="Scroll to top"
  title="Scroll to top"
  style={{...}}
>
  ↑
</button>
```

#### 5.2 Settings Button
**File**: `/src/components/HeaderView/HeaderView.jsx` Line 46
```javascript
// Before:
<button onClick={() => setShowSettings(v => !v)} className={styles.settingsButton}>
  ⚙️
</button>

// After:
<button
  onClick={() => setShowSettings(v => !v)}
  className={styles.settingsButton}
  aria-label={showSettings ? "Close settings" : "Open settings"}
  aria-expanded={showSettings}
>
  ⚙️
</button>
```

#### 5.3 History Table Rows - Keyboard Navigation
**File**: `/src/components/History/History.jsx` Line 71
```javascript
// Before:
<tr onClick={()=>!disabled&&onToggle(recipe)} ...>

// After:
<tr
  role="button"
  tabIndex={disabled ? -1 : 0}
  onClick={()=>!disabled&&onToggle(recipe)}
  onKeyDown={(e) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onToggle(recipe);
    }
  }}
  aria-label={`${selected ? 'Deselect' : 'Select'} recipe ${recipe.name}`}
  ...>
```

#### 5.4 Tab Navigation
**File**: `/src/components/TabView/TabView.jsx` Line 37
```javascript
// Add role="tablist" to nav
<div className={styles.navBar} role="tablist">
  {[['thisweek', '📅 This Week'], ['history', '🕘 History']].map(([k, l]) => (
    <button
      key={k}
      role="tab"
      aria-selected={page === k}
      aria-controls={`${k}-panel`}
      ...
```

#### 5.5 Icon Semantic Meaning
**File**: `/src/components/APIMissingView/APIMissingView.jsx` Line 15
```javascript
// Before:
<span className={styles.icon}>🔑</span>

// After:
<span className={styles.icon} role="img" aria-label="API Key">🔑</span>
```

### 6. Update App.jsx to use Config Constants (20 min)

**File**: `/src/App.jsx`

```javascript
// Add import at top:
import { DEFAULTS, STORAGE_KEYS, UI_CONFIG } from './config';

// Line 17: Update usePersistedState
const [mealData, setMealData] = usePersistedState(STORAGE_KEYS.CURRENT_MEAL_PLAN, null, 'v1');

// Line 23: Update API key storage
const [apiKey, setApiKey, apiKeyLoaded] = usePersistedState(STORAGE_KEYS.SETTINGS_API_KEY, '', 'v1');

// Line 25-27: Update defaults
const [prefs, setPrefs, prefsLoaded] = usePersistedState(STORAGE_KEYS.SETTINGS_PREFS, {
  numDinners: DEFAULTS.NUM_DINNERS,
  numPeople: DEFAULTS.NUM_PEOPLE,
  calories: DEFAULTS.CALORIES,
  isBatchEnabled: DEFAULTS.IS_BATCH_ENABLED,
  numBatch: DEFAULTS.NUM_BATCH,
  batchServings: DEFAULTS.BATCH_SERVINGS,
}, 'v1');

// Line 47: Update scroll threshold
setShowScrollTop(window.scrollY > UI_CONFIG.SCROLL_THRESHOLD);

// Line 93: Update concurrent limit
const [bParsed,...weeklyResults] = await pLimit([batchFn,...weeklyFns], API_CONFIG.MAX_CONCURRENT_REQUESTS);
```

### 7. Update Components to use Config Constants (30 min)

#### 7.1 PromptView.jsx
```javascript
import { UI_CONFIG } from '../../config';

// Line 58:
style={{ width: Math.min((elapsed / UI_CONFIG.PROGRESS_DENOMINATOR) * 100, UI_CONFIG.PROGRESS_MAX_PERCENT) + '%' }}
```

#### 7.2 Setting.jsx
```javascript
import { SETTINGS_CONFIG } from '../../config';

// Line 88-90: Use config arrays
<PickerRow label="🍽️ Dinners / week" value={localNumDinners} setValue={setLocalNumDinners} options={SETTINGS_CONFIG.DINNERS_OPTIONS} />
<PickerRow label="👥 People / dinner" value={localNumPeople} setValue={setLocalNumPeople} options={SETTINGS_CONFIG.PEOPLE_OPTIONS} />

// Line 110-111:
<PickerRow label="🍲 Batch recipes" value={localNumBatch} setValue={setLocalNumBatch} options={SETTINGS_CONFIG.BATCH_RECIPES_OPTIONS} .../>
<PickerRow label="🥣 Batch servings" value={localBatchServings} setValue={setLocalBatchServings} options={SETTINGS_CONFIG.BATCH_SERVINGS_OPTIONS} .../>
```

#### 7.3 CalorieInput.jsx
```javascript
import { SETTINGS_CONFIG } from '../../../config';

// Lines 11-12:
if (!isNaN(v) && v >= SETTINGS_CONFIG.CALORIE_MIN && v <= SETTINGS_CONFIG.CALORIE_MAX) {

// Line 57:
{SETTINGS_CONFIG.CALORIE_PRESETS.map(cal => (
```

#### 7.4 data.js - Update storage keys
```javascript
import { STORAGE_KEYS } from './config';

// Line 151: loadRecipes function
const key = storageKey === 'all' ? STORAGE_KEYS.RECIPES_ALL : STORAGE_KEYS.RECIPES_BATCH;

// Line 167: saveRecipesBatched function
await storage.set(STORAGE_KEYS.RECIPES_ALL, JSON.stringify({...}));
await storage.set(STORAGE_KEYS.RECIPES_BATCH, JSON.stringify({...}));
```

#### 7.5 CSS Modules - Use SIZE_CONFIG
```javascript
import { SIZE_CONFIG } from '../../config';

// RecreateRecipesView.module.css equivalent in inline style or CSS variable:
min-height: SIZE_CONFIG.MIN_PANEL_HEIGHT px;

// APIMissingView.module.css:
min-height: SIZE_CONFIG.MIN_PANEL_HEIGHT px;

// History.module.css selectedChips:
min-height: SIZE_CONFIG.CHIP_MIN_HEIGHT px;

// SpecialRequestTextarea equivalent:
min-height: SIZE_CONFIG.INPUT_MIN_HEIGHT px;
```

---

## 🟡 MEDIUM PRIORITY - Next Sprint

### 8. Add useMemo for cssVars Objects (2 hours)

**Files affected**: 10+ components

**Pattern to apply**:
```javascript
// Before:
const cssVars = {
  '--dim-color': C.dim,
  '--warn-color': C.warn,
};

// After:
import { useMemo } from 'react';

const cssVars = useMemo(() => ({
  '--dim-color': C.dim,
  '--warn-color': C.warn,
}), []);  // Empty deps if C is a constant object
```

**Files to update**:
- PromptView.jsx
- RecreateRecipesView.jsx
- MealView.jsx
- RulesEditor.jsx
- HeaderView.jsx
- HistoryTab.jsx
- TabView.jsx
- APIMissingView.jsx
- Setting.jsx

### 9. Add Proper Error Handling (3 hours)

#### 9.1 Create Toast Notification System
**New file**: `/src/components/Toast/Toast.jsx`

```javascript
import { useState, useEffect } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  return { toasts, addToast };
}

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
```

#### 9.2 Update App.jsx generate function
```javascript
async function generate(special) {
  try {
    // ... existing code
  } catch(e) {
    if(e.name!=='AbortError') {
      let errorMessage = 'Something went wrong';

      // Specific error messages
      if (e.message.includes('API key')) {
        errorMessage = 'Invalid API key. Please check your settings.';
      } else if (e.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (e.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = `Error: ${e.message}`;
      }

      setError(errorMessage);
      addToast(errorMessage, 'error');  // Show toast
    }
  }
}
```

#### 9.3 Update MealView clipboard handler
```javascript
// Line 22 in MealView.jsx
try {
  await navigator.clipboard.writeText(txt);
  addToast('Copied to clipboard!', 'success');
} catch(e) {
  addToast('Failed to copy. Please try manually selecting the text.', 'error');
}
```

### 10. Add Error Boundaries (1 hour)

#### 10.1 Enhance ErrorBoundary Component
**File**: `/src/components/ui/ErrorBoundary/ErrorBoundary.jsx`

```javascript
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '40px', textAlign: 'center'}}>
          <h2>Something went wrong</h2>
          <details style={{whiteSpace: 'pre-wrap', marginTop: '20px'}}>
            {this.state.error && this.state.error.toString()}
          </details>
          <button
            onClick={this.handleReset}
            style={{marginTop: '20px', padding: '10px 20px', cursor: 'pointer'}}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

#### 10.2 Wrap Critical Sections
**File**: `/src/App.jsx`

```javascript
// Wrap PromptView
<ErrorBoundary>
  <PromptView ... />
</ErrorBoundary>

// Wrap TabView
<ErrorBoundary>
  <TabView ... />
</ErrorBoundary>

// Wrap MealView
<ErrorBoundary>
  <MealView ... />
</ErrorBoundary>
```

---

## 🟢 LOW PRIORITY - Future Refactoring

### 11. Split History.jsx into Separate Files (4 hours)

**Create new files**:
- `/src/components/History/HistoryRow.jsx`
- `/src/components/History/HistoryTable.jsx`
- `/src/components/History/WeeklyHistorySubTab.jsx`
- `/src/components/History/BatchCookHistorySubTab.jsx`
- `/src/components/History/HistoryTab.jsx` (main export)

### 12. Create Settings Context (3 hours)

**New file**: `/src/contexts/SettingsContext.jsx`

```javascript
import { createContext, useContext } from 'react';
import { usePersistedState } from '../hooks';
import { DEFAULTS, STORAGE_KEYS } from '../config';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [prefs, setPrefs] = usePersistedState(STORAGE_KEYS.SETTINGS_PREFS, {
    numDinners: DEFAULTS.NUM_DINNERS,
    numPeople: DEFAULTS.NUM_PEOPLE,
    calories: DEFAULTS.CALORIES,
    isBatchEnabled: DEFAULTS.IS_BATCH_ENABLED,
    numBatch: DEFAULTS.NUM_BATCH,
    batchServings: DEFAULTS.BATCH_SERVINGS,
  }, 'v1');

  const [apiKey, setApiKey] = usePersistedState(STORAGE_KEYS.SETTINGS_API_KEY, '', 'v1');

  return (
    <SettingsContext.Provider value={{ ...prefs, apiKey, setApiKey, updateSetting: (key, value) => setPrefs(p => ({...p, [key]: value})) }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
```

This eliminates prop drilling through 3-4 levels of components.

### 13. Split data.js (2 hours)

**New structure**:
- `/src/utils/parsers.js` - parseTabFormat, findCategory
- `/src/utils/recipes.js` - safeR, recipe utilities
- `/src/utils/grocery.js` - mergeGrocery, recipesToGrocery, combineParsed
- Keep `/src/data.js` as barrel export

### 14. API Key Security Enhancement (2 hours)

**New file**: `/src/utils/encryption.js`

```javascript
// Simple XOR encryption (better than plaintext)
export function encrypt(text, key = 'meal-planner-secret') {
  let encrypted = '';
  for (let i = 0; i < text.length; i++) {
    encrypted += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(encrypted);
}

export function decrypt(encrypted, key = 'meal-planner-secret') {
  const text = atob(encrypted);
  let decrypted = '';
  for (let i = 0; i < text.length; i++) {
    decrypted += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return decrypted;
}
```

**Update hooks.js**:
```javascript
import { encrypt, decrypt } from './utils/encryption';

// In usePersistedState for API key:
if (key === STORAGE_KEYS.SETTINGS_API_KEY) {
  const encryptedValue = encrypt(newValue);
  storage.set(key, JSON.stringify({ version, value: encryptedValue }));

  // On load:
  const decryptedValue = decrypt(p.value);
  return decryptedValue;
}
```

---

## Testing Checklist

After each change, verify:
- [ ] Dev server compiles without errors
- [ ] No console errors in browser
- [ ] Settings save/load correctly
- [ ] Recipe generation works
- [ ] History selection works
- [ ] Batch cook toggle works
- [ ] Keyboard navigation works (after accessibility changes)
- [ ] Screen reader announces correctly (after accessibility changes)

---

## Estimated Total Time

| Priority | Task Count | Estimated Time |
|----------|-----------|----------------|
| ✅ Completed | 2 | 1 hour |
| 🔴 High | 5 | 3.5 hours |
| 🟡 Medium | 3 | 6 hours |
| 🟢 Low | 4 | 11 hours |
| **TOTAL** | **14** | **21.5 hours** |

---

## Recommended Implementation Order

**Sprint 1 (This Week - 3.5 hours)**:
1. Rename batchEnabled → isBatchEnabled (30 min)
2. Remove HeaderView duplication (15 min)
3. Add ARIA labels (1 hour)
4. Update App.jsx to use config (20 min)
5. Update components to use config (30 min)
6. Test everything (45 min)

**Sprint 2 (Next Week - 6 hours)**:
1. Add useMemo for cssVars (2 hours)
2. Add toast notification system (1 hour)
3. Add proper error handling (2 hours)
4. Add error boundaries (1 hour)

**Sprint 3 (Following Weeks - 11 hours)**:
1. Split History.jsx (4 hours)
2. Create Settings Context (3 hours)
3. Split data.js (2 hours)
4. Add API key encryption (2 hours)

---

This guide provides a systematic approach to improving code quality while maintaining functionality.
