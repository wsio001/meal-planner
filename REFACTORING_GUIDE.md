# Refactoring Guide - Priority Implementation Plan

This document outlines the systematic refactoring plan for the meal planner application, organized by priority and estimated effort.

**Last Updated**: March 18, 2026 - **AUDITED** ✅
**Based on**: Complete codebase verification + Task #10 implementation

---

## ✅ COMPLETED (Verified)

### 1. Created config.js ✅
- **File**: `/src/config.js`
- **Status**: ✅ Verified Present
- **Impact**: Centralizes all magic numbers and configuration

### 2. Updated api.js to use config ✅
- **File**: `/src/api.js`
- **Status**: ✅ Verified - All API_CONFIG constants in use
- **Changes**:
  - `API_CONFIG.TIMEOUT_MS`
  - `API_CONFIG.MODEL`
  - `API_CONFIG.MAX_TOKENS`
  - `API_CONFIG.RETRY_ATTEMPTS`
  - `API_CONFIG.RETRY_BACKOFF`
  - `API_CONFIG.MAX_CONCURRENT_REQUESTS`

### 3. Renamed batchEnabled → isBatchEnabled ✅
- **Status**: ✅ Verified throughout codebase
- **Impact**: Consistent boolean naming convention
- **Files verified**: App.jsx, Setting.jsx, HeaderView.jsx, TabView.jsx, PromptView.jsx

### 4. Updated App.jsx to use Config Constants ✅
- **Status**: ✅ Verified - Imports and uses all config constants
- **Confirmed usage**:
  - `DEFAULTS` for default values
  - `STORAGE_KEYS` for localStorage keys
  - `UI_CONFIG` for UI thresholds
  - `API_CONFIG` for API settings

### 5. Updated Components to use Config Constants ✅
- **Status**: ✅ Verified in all listed components
- **Files verified**:
  - `Setting.jsx` - Uses `SETTINGS_CONFIG`
  - `CalorieInput.jsx` - Uses `SETTINGS_CONFIG.CALORIE_MIN/MAX/PRESETS`
  - `LoadingModal.jsx` - Uses `UI_CONFIG`

### 6. Modal System Implementation ✅
- **Status**: ✅ Verified - Both components exist and working
- **New Components**:
  - `Modal.jsx` - Reusable modal with backdrop blur
  - `LoadingModal.jsx` - Loading state with progress tracking
- **Updated Components**:
  - `HeaderView.jsx` - Settings opens in modal
  - `Setting.jsx` - Shows green "✓ Saved" confirmation
  - `App.jsx` - Manages modal states with delays
  - `PromptView.jsx` - Removed inline loading display
- **Features Confirmed**:
  - ✅ Blurred backdrop with click-outside-to-close
  - ✅ Prevents background scrolling
  - ✅ Smooth animations (fade-in/slide-up)
  - ✅ Smart loading (skips modal for instant retrieval)
  - ✅ 800ms delay before showing results

### 7. Removed HeaderView Duplication ✅
- **Status**: ✅ Verified - Single HeaderView render (March 2026)
- **File**: `/src/App.jsx` Lines 185-227
- **Impact**: Eliminated duplicate HeaderView render
- **Verified**: HeaderView renders once outside conditional

### 8. Updated data.js to use Storage Keys ✅
- **Status**: ✅ Verified - All hardcoded strings replaced
- **File**: `/src/data.js` Lines 2, 158, 162
- **Impact**: Centralized storage key management
- **Verified**:
  - Imports `STORAGE_KEYS` from config
  - Uses `STORAGE_KEYS.RECIPES_ALL`
  - Uses `STORAGE_KEYS.RECIPES_BATCH`

### 9. Add useMemo for cssVars Objects ✅
- **Status**: ✅ Completed (March 18, 2026)
- **Impact**: Performance optimization - prevents unnecessary object recreation on every render
- **Components Updated** (10 total):
  1. ✅ PromptView.jsx - cssVars (7 properties, empty deps)
  2. ✅ TabView.jsx - cssVars (3 properties, empty deps)
  3. ✅ RecreateRecipesView.jsx - cssVars (2 properties, empty deps)
  4. ✅ HeaderView.jsx - cssVars (4 properties, deps: [showSettings])
  5. ✅ Setting.jsx - cssVars (6 properties, empty deps)
  6. ✅ LoadingModal.jsx - cssVars (2 properties, empty deps)
  7. ✅ APIMissingView.jsx - cssVars (3 properties, empty deps)
  8. ✅ CalorieInput.jsx - cssVars (5 properties, empty deps) + presetStyle (3 properties, deps: [calories, n])
  9. ✅ RulesEditor.jsx - cssVars (13 properties, empty deps)
  10. ✅ RecipeCard.jsx - cssVars (7 properties, deps: [b])
- **Pattern Applied**:
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
  }), []); // Empty deps since C is constant
  ```
- **Performance Improvement**: Reduced object recreation on every render across 10+ components
- **Note**: History.jsx and MealView.jsx already had useMemo, bringing total to 12 components optimized

---

## 🔴 HIGH PRIORITY - Not Started

### 10. Add Accessibility - ARIA Labels (2 hours)

**Current State**: ❌ **VERIFIED: Zero aria-labels in codebase** - Critical accessibility gap

This task has NOT been started. The codebase currently has:
- ❌ No `aria-label` attributes
- ❌ No `role` attributes for semantic HTML
- ❌ No `aria-*` attributes of any kind

**Required Changes:**

#### 10.1 Scroll to Top Button
**File**: `/src/App.jsx` Line ~253
```javascript
// Current:
<button onClick={scrollToTop} style={{...}}>
  ↑
</button>

// Add:
<button
  onClick={scrollToTop}
  aria-label="Scroll to top"
  title="Scroll to top"
  style={{...}}
>
  ↑
</button>
```

#### 10.2 Settings Button
**File**: `/src/components/HeaderView/HeaderView.jsx` Line 46
```javascript
// Add:
<button
  onClick={() => setShowSettings(v => !v)}
  className={styles.settingsButton}
  aria-label="Settings"
  title="Open settings"
>
  ⚙️
</button>
```

#### 10.3 Modal Accessibility
**File**: `/src/components/Modal/Modal.jsx`
```javascript
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

#### 10.4 Tab Navigation
**File**: `/src/components/TabView/TabView.jsx` Line ~50
```javascript
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

{/* Add to content sections */}
{page === 'thisweek' && (
  <div role="tabpanel" id="thisweek-panel">
    ...
  </div>
)}
```

#### 10.5 Icon Semantic Meaning
**Files**: APIMissingView.jsx, HeaderView.jsx
```javascript
<span role="img" aria-label="API Key">🔑</span>
<span role="img" aria-label="Meal">🍽️</span>
```

#### 10.6 Loading Modal Progress
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

## 🟡 MEDIUM PRIORITY - Not Started

### 11. Add Toast Notification System (3 hours)

**Current State**: ❌ **VERIFIED: No Toast component exists**

**Analysis**:
- ❌ No `/src/components/Toast/` directory
- ❌ No toast notifications in codebase
- ✅ Basic error state exists in App.jsx (limited)

**Needed**: Full toast notification system for:
- Success messages ("Settings saved", "Copied to clipboard")
- Error messages (API errors with guidance)
- Info messages (background operations)

**Quick wins after implementation**:
- Better user feedback
- Non-intrusive notifications
- Auto-dismiss functionality

---

### 12. Enhance Error Boundary (1 hour)

**Current State**: ⚠️ **VERIFIED: Basic ErrorBoundary exists but needs enhancement**

**File**: `/src/components/ui/ErrorBoundary/ErrorBoundary.jsx` - 28 lines

**What exists**:
- ✅ Basic error catching
- ✅ Error message display
- ✅ Reload button

**What's missing**:
- ❌ Error count tracking
- ❌ Auto-reload after multiple errors
- ❌ Detailed error display with stack trace
- ❌ Production error logging hooks
- ❌ Error recovery strategies
- ❌ componentDidCatch implementation

**Priority**: Medium-High (basic error handling exists, but could be much better)

---

## 🟢 LOW PRIORITY - Not Started

### 13. Create Settings Context (3 hours)

**Current State**: ❌ **VERIFIED: No context system exists**

**Analysis**:
- ❌ No `/src/contexts/` directory
- ❌ Settings passed via props through 4+ levels
- ✅ Props drilling confirmed in App.jsx → HeaderView → Setting

**Component Tree** (verified):
```
App.jsx (12 props)
  ├─ HeaderView (12 props) → Setting (12 props)
  └─ TabView (8 props) → PromptView (6 props)
```

**Impact**: Would eliminate ~60 lines of prop drilling

---

### 14. Split History.jsx into Separate Files (4 hours)

**Current State**: ❌ **VERIFIED: Single 303-line file**

**Analysis**:
- File: `/src/components/History/History.jsx`
- Size: **303 lines** (confirmed)
- Structure: Single file with multiple responsibilities
- ❌ No separate HistoryTable.jsx
- ❌ No separate HistoryRow.jsx
- ❌ No separate subtab components

**Recommendation**: Split when file complexity increases or when code reuse is needed

---

### 15. Split data.js into Domain Modules (2 hours)

**Current State**: ❌ **VERIFIED: Single 163-line file**

**Analysis**:
- File: `/src/data.js`
- Size: **163 lines** (confirmed)
- Contains: Parsing, recipes, grocery, storage logic
- ❌ No `/src/utils/` directory
- ❌ No modular organization

**Assessment**: File is manageable size but could benefit from domain separation

---

### 16. API Key Encryption Enhancement (2 hours)

**Current State**: ⚠️ **API key stored in plain text localStorage**

**Analysis**:
- Current: Plain text in localStorage
- Risk: Low (local-only, no server)
- Enhancement: Add XOR encryption for obfuscation

**Note**: This is obfuscation, not security. For production:
- Use Web Crypto API
- Consider backend proxy instead

---

### 17. Add Loading Skeletons (2 hours)

**Current State**: ❌ **VERIFIED: No skeleton components exist**

**Analysis**:
- ❌ No Skeleton.jsx component
- ❌ No loading placeholders
- Current: Blank screen while loading

**Impact**: Better perceived performance, less jarring UX

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

## 📈 Updated Time Estimates (Post-Task #10)

| Priority     | Task Count | Estimated Time | Status                    |
|--------------|------------|----------------|---------------------------|
| ✅ Completed | 9          | ~8.5 hours     | **100% Complete**         |
| 🔴 High      | 1          | ~2 hours       | **0% Started**            |
| 🟡 Medium    | 2          | ~4 hours       | **0% Started**            |
| 🟢 Low       | 5          | ~13 hours      | **0% Started**            |
| **TOTAL**    | **17**     | **~27.5 hours**| **33% Complete (9/17)**   |

---

## 🗓️ Recommended Implementation Order

### Sprint 1 (This Week - 2 hours) - HIGH PRIORITY
**Focus: Accessibility improvements**

1. ✅ ~~Remove HeaderView duplication~~ - **DONE**
2. ✅ ~~Update data.js to use STORAGE_KEYS~~ - **DONE**
3. ✅ ~~Add useMemo for cssVars~~ - **DONE (March 18, 2026)**
4. ❌ **Add accessibility - ARIA labels (2 hours)** ← START HERE
   - Critical for screen reader users
   - Improves SEO and usability
   - Low effort, high impact

### Sprint 2 (Next Week - 4 hours) - MEDIUM PRIORITY
**Focus: User feedback and error handling**

1. ❌ Create toast notification system (3 hours)
   - Better user feedback
   - Success/error messages
2. ❌ Enhance error boundary (1 hour)
   - Better error recovery
   - Production logging hooks

### Sprint 3 (Week 3 - 6 hours) - LOW PRIORITY
**Focus: Architecture improvements**

1. ❌ Create Settings Context (3 hours)
   - Eliminate prop drilling
   - Cleaner component tree
2. ❌ Split History.jsx (3 hours)
   - Better organization
   - Reusable components

### Sprint 4 (Week 4 - 7 hours) - POLISH
**Focus: Code organization and polish**

1. ❌ Split data.js into modules (2 hours)
2. ❌ Add API key encryption (2 hours)
3. ❌ Add loading skeletons (2 hours)
4. ❌ Final testing and polish (1 hour)

---

## 💡 Key Findings from Audit

### ✅ Good News
- **Config centralization is complete** - All constants properly organized
- **Modal system is excellent** - Well implemented with good UX
- **Code duplication eliminated** - HeaderView refactor successful
- **Performance optimized** - All 12 components now use useMemo for cssVars (March 18, 2026)

### ⚠️ Areas Needing Attention
- **Zero accessibility attributes** - This is the #1 priority
- **No toast notifications** - User feedback could be much better
- **Error boundary is minimal** - Needs enhancement for production
- **Prop drilling exists** - Settings Context would help significantly

### 📝 Assessment
- **Overall code quality**: Good
- **Architecture**: Solid foundation
- **Completion rate**: 33% (9/17 tasks)
- **Critical gaps**: Accessibility (#1 priority)

---

## 🎯 Next Immediate Action

**START WITH TASK #10: Add Accessibility - ARIA Labels**

This task is:
- ✅ High impact (affects all users, especially those using assistive tech)
- ✅ Low complexity (mostly adding attributes)
- ✅ Quick wins (2 hours for full implementation)
- ✅ No breaking changes
- ✅ Improves SEO

**Estimated completion**: 2 hours
**Files to modify**: 6-8 components
**Testing**: Use browser DevTools accessibility tab + screen reader

---

*Last Updated: March 18, 2026*
*Version: 4.0 - Task #10 (useMemo optimization) COMPLETED ✅*
*Previous Update: March 16, 2026 (Initial Audit)*
