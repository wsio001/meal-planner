# Manual Testing Guide: Settings Modal Error States

This guide shows you how to manually trigger each error state in the Settings modal for testing purposes.

---

## 1. API Key Validation States

### ✗ Invalid - Missing Prefix
1. Open Settings modal (gear icon)
2. Clear the API key field
3. Type any text without `sk-ant-` prefix (e.g., `myapikey123`)
4. Wait 500ms
5. **Expected**: Red `✗ Please enter a valid API key` message appears
6. **Save button**: Disabled

### ✗ Invalid - Too Short
1. Open Settings modal
2. Type `sk-ant-short` (less than 40 characters total)
3. Wait 500ms
4. **Expected**: Red `✗ API key is too short` message appears
5. **Save button**: Disabled

### ✓ Valid
1. Open Settings modal
2. Type `sk-ant-` followed by 40+ characters (e.g., `sk-ant-1234567890123456789012345678901234567890`)
3. Wait 500ms
4. **Expected**: Green `✓ Valid API key` message appears
5. **Save button**: Enabled

### ⏳ Checking
1. Open Settings modal
2. Start typing any API key
3. **Expected**: Gray `⏳ Checking...` appears immediately (during 500ms debounce)

---

## 2. Save Success State

### Green Checkmark Success
1. Open Settings modal
2. Enter a valid API key (see above)
3. Change any setting (e.g., number of dinners)
4. Click **Save**
5. **Expected sequence**:
   - Gray overlay with spinner + "Saving..." (500ms minimum)
   - Green overlay with big ✓ (68px) + "Saved" (1 second)
   - Modal auto-closes

---

## 3. Storage Quota Exceeded Error

**Note**: This requires filling up your browser's localStorage. Here's how:

### Method 1: Using Browser DevTools (RECOMMENDED)
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Paste and run this code to **mock** QuotaExceededError:
   ```javascript
   // Mock localStorage.setItem to throw QuotaExceededError
   const originalSetItem = localStorage.setItem;
   localStorage.setItem = function(key, value) {
     const error = new Error('QuotaExceededError');
     error.name = 'QuotaExceededError';  // IMPORTANT: Set the name
     throw error;
   };
   ```
4. Now open Settings modal and try to save
5. **Expected**:
   - Red overlay with big ✗ (68px)
   - Message: "Could not save settings - storage is full"
   - Detail: "You might have too much meal history saved"
   - Button: **"Go to History"** (ONLY - no "Try Again" since retrying won't help)
   - Modal stays open (does not auto-close)
   - Clicking "Go to History" switches to History tab immediately

6. **To clean up**: Refresh the page OR run in console:
   ```javascript
   // Restore original localStorage
   localStorage.setItem = originalSetItem;
   ```

### Method 2: Temporary Code Modification
1. Open `src/contexts/SettingsContext.jsx`
2. Add a test flag at the top of `saveSettings` function (line 55):
   ```javascript
   const saveSettings = useCallback(async (newSettings) => {
     const TEST_QUOTA_ERROR = true; // TESTING ONLY - REMOVE AFTER

     if (TEST_QUOTA_ERROR) {
       throw new Error('QUOTA_EXCEEDED');
     }

     // ... rest of function
   ```
3. Save the file (hot reload will apply changes)
4. Try to save settings
5. **Remember to remove this test code after testing!**

---

## 4. Storage Disabled Error (Session-Only Mode)

**Note**: This happens when browser blocks localStorage (private browsing, extensions, security settings).

### Method 1: Private/Incognito Mode
1. Open your app in **Private/Incognito window**
2. Some browsers block localStorage in this mode
3. Open Settings and try to save
4. **Expected**:
   - Green overlay with ✓ + "Saved" (saves to memory)
   - Yellow warning banner appears at top: `⚠️ Storage is disabled - settings won't persist`
   - Modal closes normally
   - Settings work for current session only

### Method 2: Browser DevTools (RECOMMENDED)
1. Open DevTools → **Console**
2. Run this code to simulate blocked storage:
   ```javascript
   // Mock localStorage.setItem to throw SecurityError
   const originalSetItem = localStorage.setItem;
   localStorage.setItem = function(key, value) {
     const error = new Error('Storage disabled');
     error.name = 'SecurityError';  // IMPORTANT: Set the name
     throw error;
   };
   ```
3. Try to save settings
4. **Expected**:
   - Gray overlay with spinner + "Saving..." (500ms)
   - Yellow overlay with ⚠️ (68px) + "Settings saved for this session"
   - Detail: "Storage is disabled - your settings won't persist after closing this page"
   - Button: **"Got It"**
   - Modal stays open until you click "Got It"
   - After closing modal, yellow banner appears at top of app

5. **To restore**: Refresh the page OR run in console:
   ```javascript
   // Restore original localStorage
   localStorage.setItem = originalSetItem;
   ```

### Method 3: Temporary Code Modification
1. Open `src/contexts/SettingsContext.jsx`
2. Add test code at line 57 in `saveSettings`:
   ```javascript
   const saveSettings = useCallback(async (newSettings) => {
     try {
       const TEST_SECURITY_ERROR = true; // TESTING ONLY - REMOVE AFTER

       if (TEST_SECURITY_ERROR) {
         const error = new Error('Storage disabled');
         error.name = 'SecurityError';
         throw error;
       }

       // ... rest of function
   ```
3. **Remember to remove after testing!**

---

## 5. Generic Error with Retry

### Temporary Code Modification
1. Open `src/contexts/SettingsContext.jsx`
2. Add test code at line 57 in `saveSettings`:
   ```javascript
   const saveSettings = useCallback(async (newSettings) => {
     try {
       const TEST_GENERIC_ERROR = true; // TESTING ONLY - REMOVE AFTER

       if (TEST_GENERIC_ERROR) {
         throw new Error('Simulated network error');
       }

       // ... rest of function
   ```
3. Try to save settings
4. **Expected**:
   - Red overlay with big ✗ (68px)
   - Message: "Could not save settings"
   - Detail: "Simulated network error"
   - Button: **"Try Again"**
   - Modal stays open

5. Click **Try Again**
6. **Expected**: Save attempt repeats (will fail again until you remove test code)

7. **Remember to remove test code!**

---

## 6. Loading State Only

To see just the loading state without completion:

1. Open `src/components/Setting/Setting.jsx`
2. Find the `handleSave` function (around line 80)
3. Add a longer delay:
   ```javascript
   // Change from 500ms to 5000ms for testing
   await new Promise(resolve => setTimeout(resolve, 5000));
   ```
4. Save settings
5. **Expected**: Gray spinner + "Saving..." for 5 seconds
6. **Remember to change back to 500ms!**

---

## Summary of All States

| State | Icon | Message | Button(s) | Auto-Close? |
|-------|------|---------|-----------|-------------|
| **Saving** | Spinner | "Saving..." | None | No |
| **Success** | Green ✓ (68px) | "Saved" | None | Yes (1s) |
| **Quota Exceeded** | Red ✗ (68px) | "Could not save settings - storage is full" | "Go to History" | No |
| **Session-Only** | Yellow ⚠️ (68px) | "Settings saved for this session" | "Got It" | No |
| **Generic Error** | Red ✗ (68px) | "Could not save settings" + error detail | "Try Again" | No |

**Note**: After session-only modal closes, a yellow banner appears at the top: "⚠️ Storage is disabled - settings won't persist"

---

## Tips

- The **500ms loading minimum** ensures users see the loading state even on fast saves
- The **1 second success display** gives satisfying feedback before auto-close
- **Error states stay open** so users can read the message and take action
- **Session-only mode is silent** - no error overlay, just a persistent banner
