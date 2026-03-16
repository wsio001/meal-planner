# Refactoring Guide - Priority Implementation Plan

This document outlines the systematic refactoring plan for the meal planner application, organized by priority and estimated effort.

**Last Updated**: March 16, 2026
**Based on**: Current codebase analysis

---

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
  - `API_CONFIG.MAX_CONCURRENT_REQUESTS` (was 3)
- **Status**: ✅ Done

### 3. Renamed batchEnabled → isBatchEnabled
- **Status**: ✅ Done
- **Impact**: Consistent boolean naming convention throughout codebase
- **Files updated**: App.jsx, Setting.jsx, HeaderView.jsx, TabView.jsx, PromptView.jsx

### 4. Updated App.jsx to use Config Constants
- **Status**: ✅ Done
- **Files**: App.jsx now imports and uses:
  - `DEFAULTS` for default values
  - `STORAGE_KEYS` for localStorage keys
  - `UI_CONFIG` for UI thresholds
  - `API_CONFIG` for API settings

### 5. Updated Components to use Config Constants
- **Status**: ✅ Done
- **Files updated**:
  - `Setting.jsx` - Uses `SETTINGS_CONFIG`
  - `CalorieInput.jsx` - Uses `SETTINGS_CONFIG.CALORIE_MIN/MAX/PRESETS`
  - `LoadingModal.jsx` - Uses `UI_CONFIG`

### 6. Modal System Implementation
- **Status**: ✅ Done (March 2026)
- **New Components**:
  - `Modal.jsx` - Reusable modal with backdrop blur
  - `LoadingModal.jsx` - Loading state with progress tracking
- **Updated Components**:
  - `HeaderView.jsx` - Settings now opens in modal
  - `Setting.jsx` - Shows green "✓ Saved" confirmation
  - `App.jsx` - Manages modal states with delays
  - `PromptView.jsx` - Removed inline loading display
- **Features**:
  - Blurred backdrop with click-outside-to-close
  - Prevents background scrolling
  - Smooth animations (fade-in/slide-up)
  - Smart loading (skips modal for instant retrieval)
  - 800ms delay before showing results

---

## 🔴 HIGH PRIORITY - Do Next

### 7. Remove HeaderView Duplication (15 min)

**File**: `/src/App.jsx` Lines ~185-246

**Current** (duplicated):
```javascript
{!apiKey ? (
  <>
    <HeaderView {...allProps} />  // Line ~187
    <APIMissingView />
  </>
) : (
  <>
    <HeaderView {...allProps} />  // Line ~208 - DUPLICATE!
    <TabView ... />
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
  <TabView ... />
)}
```

**Impact**: Reduces code duplication, easier maintenance

---

### 8. Add Accessibility - ARIA Labels (2 hours)

**Current State**: ❌ No ARIA labels exist in the codebase - significant accessibility gap

#### 8.1 Scroll to Top Button

**File**: `/src/App.jsx` Line ~253

```javascript
// Current:
<button onClick={scrollToTop} style={{...}}>
  ↑
</button>

// Fixed:
<button
  onClick={scrollToTop}
  aria-label="Scroll to top"
  title="Scroll to top"
  style={{...}}
>
  ↑
</button>
```

#### 8.2 Settings Button

**File**: `/src/components/HeaderView/HeaderView.jsx` Line 46

```javascript
// Current:
<button onClick={() => setShowSettings(v => !v)} className={styles.settingsButton}>
  ⚙️
</button>

// Fixed:
<button
  onClick={() => setShowSettings(v => !v)}
  className={styles.settingsButton}
  aria-label="Settings"
  title="Open settings"
>
  ⚙️
</button>
```

#### 8.3 Modal Accessibility

**File**: `/src/components/Modal/Modal.jsx`

```javascript
// Add to modal:
<div
  className={styles.modalBackdrop}
  onClick={handleBackdropClick}
  role="dialog"
  aria-modal="true"
>
  <div className={styles.modalContent} role="document">
    {children}
  </div>
</div>
```

#### 8.4 History Table Rows - Keyboard Navigation

**File**: `/src/components/History/History.jsx`

```javascript
// Add keyboard support to clickable table rows:
<tr
  role="button"
  tabIndex={disabled ? -1 : 0}
  onClick={() => !disabled && onToggle(recipe)}
  onKeyDown={(e) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onToggle(recipe);
    }
  }}
  aria-label={`${selected ? 'Deselect' : 'Select'} recipe ${recipe.name}`}
  style={...}
>
```

#### 8.5 Tab Navigation

**File**: `/src/components/TabView/TabView.jsx` Line ~53

```javascript
// Add ARIA roles to tab navigation:
<div className={styles.navBar} role="tablist">
  {[['thisweek', '📅 This Week'], ['history', '🕘 History']].map(([k, l]) => (
    <button
      key={k}
      role="tab"
      aria-selected={page === k}
      aria-controls={`${k}-panel`}
      onClick={() => handlePageChange(k)}
      className={`${styles.navButton} ${page === k ? styles.active : ''}`}
      style={cssVars}
    >
      {l}
    </button>
  ))}
</div>

{/* Add role="tabpanel" to content sections */}
{page === 'thisweek' && (
  <div role="tabpanel" id="thisweek-panel" aria-labelledby="thisweek-tab">
    ...
  </div>
)}
```

#### 8.6 Icon Semantic Meaning

**Files**: Multiple components use emoji icons

```javascript
// APIMissingView.jsx:
<span className={styles.icon} role="img" aria-label="API Key">🔑</span>

// HeaderView.jsx (title):
<h1 className={styles.title}>
  <span role="img" aria-label="Meal">🍽️</span> Weekly Meal Planner
</h1>
```

#### 8.7 Loading Modal Progress Items

**File**: `/src/components/LoadingModal/LoadingModal.jsx`

```javascript
<div
  key={i}
  className={itemClass}
  role="status"
  aria-live="polite"
  aria-label={`${isBatch ? 'Batch ' + (i - numDinners + 1) : 'Recipe ' + (i + 1)} ${done ? 'completed' : 'in progress'}`}
>
  {done ? '✓' : '⏳'} {isBatch ? 'Batch ' + (i - numDinners + 1) : 'Recipe ' + (i + 1)}
</div>
```

---

### 9. Update data.js to use Storage Keys (10 min)

**File**: `/src/data.js`

**Current**: Uses hardcoded strings
**Need**: Import and use `STORAGE_KEYS` from config

```javascript
import { STORAGE_KEYS } from './config';

// Line ~158:
await Promise.all([
  save(weekly, STORAGE_KEYS.RECIPES_ALL),
  save(batch, STORAGE_KEYS.RECIPES_BATCH)
]);

// Line ~162:
try {
  const r = await storage.get(key || STORAGE_KEYS.RECIPES_ALL);
  return r ? JSON.parse(r.value) : [];
}
```

---

## 🟡 MEDIUM PRIORITY - Next Sprint

### 10. Add useMemo for cssVars Objects (2 hours)

**Current State**: cssVars objects are recreated on every render

**Files affected** (10+ components):
- CalorieInput.jsx ✅ (already using React.memo)
- PromptView.jsx
- RecreateRecipesView.jsx
- MealView.jsx
- RulesEditor.jsx
- HeaderView.jsx
- HistoryTab.jsx
- TabView.jsx
- APIMissingView.jsx
- Setting.jsx

**Pattern to apply**:
```javascript
import { useMemo } from 'react';

// Before:
const cssVars = {
  '--dim-color': C.dim,
  '--warn-color': C.warn,
};

// After:
const cssVars = useMemo(() => ({
  '--dim-color': C.dim,
  '--warn-color': C.warn,
}), []); // Empty deps if C is a constant object
```

**Note**: Since `C` (colors) is imported from constants.js and never changes, dependencies array should be empty.

---

### 11. Add Toast Notification System (3 hours)

**Current State**:
- Basic error state exists in App.jsx
- No user-friendly success/info messages
- No visual feedback for actions

**Create new component**: `/src/components/Toast/Toast.jsx`

See full implementation in Low Priority section below for complete code.

**Quick wins**:
- Success: "Copied to clipboard!", "Settings saved", "Recipes generated"
- Errors: Specific API error messages with retry guidance
- Info: "Loading recipes...", "Generating meal plan..."

---

### 12. Enhance Error Boundary (1 hour)

**File**: `/src/components/ui/ErrorBoundary/ErrorBoundary.jsx`

**Enhancements needed**:
- Add error count tracking
- Auto-reload after 3+ errors
- Better error display with details
- Production error logging hooks

See Low Priority section for full implementation.

---

## 🟢 LOW PRIORITY - Future Refactoring

### 13. Create Settings Context (3 hours)

**Current Issue**: Settings props passed through 4+ levels (prop drilling)

**Affected Component Tree**:
```
App.jsx
  ├─ HeaderView (receives 12 props)
  │   └─ Setting (receives 12 props)
  └─ TabView (receives 8 props)
      ├─ PromptView (receives 6 props)
      └─ RecreateRecipesView (receives 4 props)
```

**Solution**: Create SettingsContext

**Impact**:
- Eliminates ~60 lines of prop drilling
- Easier to add new settings
- Components access settings directly via `useSettings()` hook

---

### 14. Split History.jsx into Separate Files (4 hours)

**Current State**: History.jsx is ~300 lines with multiple responsibilities

**New structure**:
```
components/History/
├── History.jsx              # Main export, tab switching
├── HistoryTable.jsx         # Reusable table with checkboxes
├── HistoryRow.jsx           # Individual table row
├── WeeklyHistorySubTab.jsx  # Weekly recipes tab
├── BatchHistorySubTab.jsx   # Batch recipes tab
└── History.module.css       # Shared styles
```

**Benefits**:
- Better code organization
- Reusable HistoryTable component
- Easier testing
- Clear separation of concerns

---

### 15. Split data.js into Domain Modules (2 hours)

**Current State**: data.js contains parsing, recipes, grocery, storage logic (164 lines)

**New structure**:
```
utils/
├── parsers.js      # parseTabFormat, findCategory
├── recipes.js      # safeR, recipe normalization
├── grocery.js      # mergeGrocery, grocery utilities
├── storage.js      # saveRecipesBatched, loadRecipes
└── index.js        # Barrel export (re-export all)
```

**Migration**:
```javascript
// Old:
import { parseTabFormat, safeR, mergeGrocery } from './data';

// New (same import via barrel):
import { parseTabFormat, safeR, mergeGrocery } from './utils';
```

---

### 16. API Key Encryption Enhancement (2 hours)

**Current State**: API key stored in plain text in localStorage

**Security Enhancement**: Add XOR encryption for obfuscation

**Note**: This is obfuscation, not true security. For production, consider:
- Web Crypto API for stronger encryption
- Never store API keys client-side if possible
- Use backend proxy for API calls

---

### 17. Add Loading Skeletons (2 hours)

**Current State**: Blank screen while data loads

**Create**: Skeleton loading components for better UX

**Usage**:
```javascript
// In ThisWeekTab.jsx:
{!mealData ? (
  <>
    <RecipeCardSkeleton />
    <RecipeCardSkeleton />
    <RecipeCardSkeleton />
  </>
) : (
  <MealView mealData={mealData} />
)}
```

---

## 📊 Testing Checklist

After each change, verify:

- [ ] Dev server compiles without errors (`npm run dev`)
- [ ] No console errors in browser
- [ ] Settings save/load correctly (check localStorage)
- [ ] Recipe generation works (API calls succeed)
- [ ] History selection works (select/deselect)
- [ ] Batch cook toggle works
- [ ] Modal opens and closes properly
- [ ] Loading states display correctly
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader announces correctly (test with VoiceOver/NVDA)
- [ ] Mobile responsive (test on 375px, 768px, 1024px)

---

## 📈 Estimated Total Time

| Priority     | Task Count | Estimated Time | Status          |
|--------------|------------|----------------|-----------------|
| ✅ Completed | 6          | ~6 hours       | Done            |
| 🔴 High      | 3          | ~2.5 hours     | Ready to start  |
| 🟡 Medium    | 3          | ~6 hours       | Next sprint     |
| 🟢 Low       | 5          | ~13 hours      | Future backlog  |
| **TOTAL**    | **17**     | **~27.5 hours**| -               |

---

## 🗓️ Recommended Implementation Order

### Sprint 1 (This Week - 2.5 hours)
**Focus: Clean up tech debt, improve accessibility**

1. Remove HeaderView duplication (15 min)
2. Update data.js to use STORAGE_KEYS (10 min)
3. Add accessibility - ARIA labels (2 hours)
4. Test everything (30 min)

### Sprint 2 (Next Week - 6 hours)
**Focus: Error handling and performance**

1. Add useMemo for cssVars (2 hours)
2. Create toast notification system (2 hours)
3. Enhance error handling with toasts (1.5 hours)
4. Enhance error boundary (30 min)

### Sprint 3 (Week 3 - 6 hours)
**Focus: Architecture improvements**

1. Create Settings Context (3 hours)
2. Split History.jsx (3 hours)

### Sprint 4 (Week 4 - 7 hours)
**Focus: Code organization and polish**

1. Split data.js into modules (2 hours)
2. Add API key encryption (2 hours)
3. Add loading skeletons (2 hours)
4. Final testing and polish (1 hour)

---

## 💡 Notes

- **Breaking Changes**: Settings Context will require component refactoring
- **Testing**: Add accessibility testing with axe DevTools or Lighthouse
- **Documentation**: Update CLAUDE.md after major refactors
- **Git**: Commit after each completed task
- **Code Review**: Test each feature independently before moving to next
- **Priority Flexibility**: High priority items provide immediate value, but can be done in any order

---

*Last Updated: March 16, 2026*
*Version: 2.0*
