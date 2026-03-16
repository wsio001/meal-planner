# Weekly Meal Planner - Technical Documentation

## Project Overview

A React-based web application that generates personalized weekly meal plans using Claude AI (Anthropic). The app features intelligent recipe generation with customizable dietary preferences, batch cooking support, recipe history management, and modal-based UI interactions.

**Tech Stack:**
- React 18.3.0
- Vite 5.4.0 (build tool)
- CSS Modules (styling)
- Anthropic Claude API (Haiku 4.5 model)
- LocalStorage (persistence)

---

## Architecture Overview

### Core Design Principles

1. **Component-Based Architecture**: Modular React components with CSS Modules for scoped styling
2. **Centralized Configuration**: All constants, API settings, and defaults in dedicated config files
3. **Local-First Persistence**: All data stored in browser localStorage with versioned schemas
4. **Modal-Based Interactions**: Settings and loading states use modal overlays with backdrop blur
5. **Concurrent API Calls**: Parallel recipe generation with configurable concurrency limits
6. **Intelligent Caching**: Recipe history system with deduplication and reuse capabilities

---

## File Structure

```
meal-planner/
├── index.html                      # Entry HTML file
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite configuration
└── src/
    ├── main.jsx                    # React entry point
    ├── App.jsx                     # Root component, state management
    │
    ├── Core Utilities/
    │   ├── api.js                  # Claude API integration, prompt building
    │   ├── data.js                 # Data parsing, merging, persistence
    │   ├── storage.js              # localStorage adapter
    │   ├── config.js               # Centralized configuration
    │   ├── constants.js            # Colors, styles, cuisines, defaults
    │   └── hooks.js                # Custom React hooks
    │
    └── components/
        ├── UI Components/
        │   ├── Modal/              # Reusable modal with backdrop blur
        │   ├── LoadingModal/       # Loading state modal with progress
        │   ├── HeaderView/         # App header with settings button
        │   ├── TabView/            # Main tab navigation (This Week / History)
        │   ├── PromptView/         # Recipe generation interface
        │   ├── ThisWeekTab/        # Display current meal plan
        │   ├── RecreateRecipesView/ # History recipe selection UI
        │   ├── Setting/            # Settings panel component
        │   ├── APIMissingView/     # API key prompt screen
        │   ├── RulesEditor/        # Custom dietary rules editor
        │   ├── MealView/           # Recipe display sections
        │   ├── RecipeCard/         # Individual recipe cards
        │   └── History/            # History management with subtabs
        │
        └── ui/                     # Reusable UI primitives
            ├── PickerRow/          # Number picker component
            ├── CalorieInput/       # Calorie input with presets
            ├── GenerateButton/     # Primary action button
            ├── SectionHeader/      # Section title component
            ├── HistoryMealsCounter/ # History selection counter
            ├── ErrorBoundary/      # Error boundary wrapper
            └── index.js            # UI component exports
```

---

## Core System Components

### 1. State Management (App.jsx)

**Primary State:**
- `loading`: Generation in progress flag
- `showLoadingModal`: Controls loading modal visibility
- `stage`: Current generation stage text
- `progress`: Array tracking individual recipe completion
- `mealData`: Current meal plan with recipes, grocery list, notes
- `error`: Error message display
- `selectedWeekly`: Selected recipes from history for reuse
- `selectedBatch`: Selected batch cook recipes from history

**Persisted State (via usePersistedState):**
- `apiKey`: User's Anthropic API key
- `prefs`: User preferences (dinners, people, calories, batch settings)
- `customRules`: User's dietary rules

**Key Functions:**
- `generate(special, skipLoadingModal)`: Main generation orchestrator
  - Picks random cuisines
  - Chunks recipes into parallel API calls
  - Handles retry logic for missing recipes
  - Manages loading modal visibility
  - Supports fast-path for reused meals (skipLoadingModal)
- `handleRecreate()`: Regenerate with selected history recipes

### 2. API Integration (api.js)

**callClaude(system, user, signal, apiKey, tries)**
- Direct browser API calls to Anthropic
- Retry logic with exponential backoff
- Timeout handling (90s default)
- AbortController support for cancellation

**buildPrompt(num, servings, calories, special, rules, isBatch)**
- Constructs system and user prompts
- Injects dietary rules and constraints
- Different prompt structure for batch vs. weekly recipes
- Structured output format (TAB-delimited sections)

**Concurrency Control:**
- `pLimit(fns, limit)`: Runs async functions with max concurrency
- Default: 3 concurrent API calls
- Worker pool pattern for queue processing

**Cuisine Randomization:**
- `pickCuisines(n)`: Fisher-Yates shuffle of 20 cuisines
- Ensures variety across meal plans

### 3. Data Layer (data.js)

**Parsing:**
- `parseTabFormat(text)`: Parses Claude's TAB-delimited response into structured data
  - Section 1: Recipe overview (name, cuisine)
  - Section 2: Grocery list (type, item, quantity, recipe)
  - Section 3: Full recipe details (ingredients, workflow)
  - Extracts category information for ingredients
  - Generates iPhone Notes format for shopping lists

**Merging:**
- `mergeParsedArray(parsedArr)`: Combines multiple API responses
- `combineParsed(wP, bP, pastBatch)`: Merges weekly, batch, and history recipes
- `mergeGrocery(...lists)`: Deduplicates grocery items across recipes

**Persistence:**
- `saveRecipesBatched(weekly, batch)`: Saves recipes to history
  - Deduplicates by recipe name
  - Separate storage for weekly vs. batch recipes
- `loadRecipes(key)`: Retrieves recipe history

### 4. Storage (storage.js)

**localStorage Adapter:**
- Async API wrapping localStorage
- Supports get, set, delete, list operations
- Error handling for missing keys
- Originally designed for Claude artifact environment compatibility

### 5. Configuration (config.js)

**Centralized Settings:**

```javascript
API_CONFIG = {
  TIMEOUT_MS: 90000,
  MODEL: 'claude-haiku-4-5-20251001',
  MAX_TOKENS: 2500,
  RETRY_ATTEMPTS: 3,
  RETRY_BACKOFF: (attempt) => 2^attempt * 1000,
  MAX_CONCURRENT_REQUESTS: 3
}

DEFAULTS = {
  NUM_DINNERS: 3,
  NUM_PEOPLE: 2,
  CALORIES: 750,
  IS_BATCH_ENABLED: false,
  NUM_BATCH: 2,
  BATCH_SERVINGS: 15
}

STORAGE_KEYS = {
  CURRENT_MEAL_PLAN: 'currentMealPlan',
  SETTINGS_PREFS: 'settings:prefs',
  SETTINGS_API_KEY: 'settings:apiKey',
  RECIPES_ALL: 'recipes:all',
  RECIPES_BATCH: 'recipes:batch'
}
```

### 6. Custom Hooks (hooks.js)

**useElapsed(active)**
- Timer hook for displaying generation duration
- Auto-resets on generation start

**usePersistedState(key, defaultValue, version)**
- Persists state to localStorage with versioning
- Handles data migration from legacy formats
- Returns: [value, setValue, loaded]

---

## UI/UX Features

### Modal System

**Modal Component** (Modal.jsx)
- Blurred backdrop (`backdrop-filter: blur(8px)`)
- Prevents background scrolling
- Click-outside to close (configurable)
- Smooth fade-in/slide-up animations
- z-index: 9999

**LoadingModal Component** (LoadingModal.jsx)
- Shows animated spinner during generation
- Progress bar with time elapsed
- Individual recipe completion states
- Color-coded: Purple for weekly, Teal for batch
- Automatically closes with delay after completion

**Settings Modal**
- Opens from gear icon in header
- Local state (changes not applied until Save)
- Green "✓ Saved" confirmation animation
- Auto-closes after 1.5s delay
- Contains: API key, dinners, people, calories, batch settings

### Tab Navigation

**This Week Tab:**
- Recipe generation interface (PromptView)
- Special request text area
- Custom dietary rules editor
- Current meal plan display (ThisWeekTab)

**History Tab:**
- Two subtabs: Weekly Recipes, Batch Cook Recipes
- Recipe selection with checkmarks
- View full meal plan history
- Delete individual recipes
- Reuse selected recipes in new plan

### Smart Generation

**Fast Path Optimization:**
- When `needFill = 0` (all meals reused from history)
- Skips loading modal for instant display
- No API calls needed

**Progress Tracking:**
- Individual slots for each recipe
- Real-time completion updates
- Shortfall recovery (retry missing recipes)

---

## Key Features

### 1. Recipe Generation
- AI-powered recipe creation using Claude Haiku
- Randomized cuisine selection from 20 options
- Parallel API calls for faster generation
- Automatic retry with exponential backoff
- Structured output parsing

### 2. Batch Cooking Support
- Generate recipes optimized for storage/reheating
- Separate batch recipe history
- Configurable servings (8-20)
- Mix weekly dinners + batch recipes
- Visual distinction (teal color scheme)

### 3. Dietary Customization
- Customizable dietary rules
- Default: Keto/normal portions, high protein, mild spice
- Per-generation special requests
- Calorie targets (300-1500 per serving)
- Serving size adjustment (1-6 people)

### 4. Recipe History
- Persistent storage of all generated recipes
- Browse and search history
- Select recipes for reuse
- Delete unwanted recipes
- Separate weekly and batch histories

### 5. Grocery Management
- Consolidated grocery list
- Categorized by type (Produce, Protein, Pantry, etc.)
- iPhone Notes format for easy shopping
- Ingredient quantities merged across recipes
- Recipe attribution per ingredient

### 6. Settings Management
- Secure API key storage (local only)
- Preference persistence with versioning
- Visual feedback on save
- Batch cooking toggle
- Modal-based interface

---

## Data Flow

### Generation Flow

```
User clicks "Generate"
    ↓
App.generate(special)
    ↓
Show LoadingModal
    ↓
Pick random cuisines → Chunk into groups of 2
    ↓
Build prompts with rules and constraints
    ↓
Call Claude API (3 concurrent requests)
    ↓
Parse TAB-formatted responses
    ↓
Retry any missing recipes (shortfall recovery)
    ↓
Merge weekly + batch + history recipes
    ↓
Save new recipes to history
    ↓
Delay 800ms → Close modal → Display results
```

### History Reuse Flow

```
User selects recipes from history
    ↓
Calculate needFill = numDinners - selectedCount
    ↓
If needFill = 0:
    Skip LoadingModal (fast path)
Else:
    Show LoadingModal
    ↓
Generate only needed recipes (numDinners - selectedCount)
    ↓
Combine generated + selected recipes
    ↓
Display merged meal plan
```

---

## Styling Architecture

### CSS Modules
- Scoped styles per component
- No global namespace pollution
- Co-located with component files

### Design System (constants.js)

**Color Palette:**
- Background: `#0f172a` (dark blue)
- Card: `#1e293b` (lighter blue)
- Accent: `#6366f1` (purple) - weekly recipes
- Teal: `#2dd4bf` - batch recipes
- Success: `#34d399` (green)
- Danger: `#ef4444` (red)

**Component Patterns:**
- Consistent border radius (8-16px)
- Gradient headers for visual hierarchy
- Color-coded recipe types (purple/teal)
- Responsive flex layouts

---

## API Key Security

**Security Model:**
- API key stored in browser localStorage only
- Never sent to external servers (except Anthropic API)
- Direct browser-to-Anthropic communication
- Header: `anthropic-dangerous-direct-browser-access: true`
- User owns their API costs and data

**User Experience:**
- Masked password input
- Persistent storage across sessions
- Settings modal for easy updates
- Prominent security notice in UI

---

## Performance Optimizations

1. **Parallel API Calls**: Up to 3 concurrent recipe generations
2. **Request Chunking**: Groups recipes into batches of 2
3. **Retry Logic**: Automatic retry with backoff on failures
4. **Shortfall Recovery**: Re-requests only missing recipes
5. **Fast Path**: Instant display for history-only meal plans
6. **Progress Feedback**: Real-time UI updates during generation
7. **Grocery Deduplication**: Efficient merging of ingredient lists
8. **Component Code Splitting**: Lazy loading via React patterns

---

## Storage Schema

### Versioned Persistence
All stored data includes version field for migration support.

**Settings (settings:prefs):**
```json
{
  "version": "v1",
  "value": {
    "numDinners": 3,
    "numPeople": 2,
    "calories": 750,
    "isBatchEnabled": false,
    "numBatch": 2,
    "batchServings": 15
  }
}
```

**Recipe Storage (recipes:all / recipes:batch):**
```json
[
  {
    "id": "RecipeName_0",
    "number": 1,
    "name": "Thai Green Curry",
    "cuisine": "Thai",
    "cookTime": "25 mins",
    "caloriesPerServing": 680,
    "ingredients": [
      { "text": "2 tbsp green curry paste", "category": "Sauce" },
      { "text": "1 lb chicken breast", "category": "Protein/Meat" }
    ],
    "workflow": [
      "0:00 - Prep ingredients",
      "0:05 - Cook curry paste"
    ],
    "isBatchCook": false
  }
]
```

---

## Recent Changes (Latest Session)

### Modal System Implementation
1. Created reusable Modal component with backdrop blur
2. Built LoadingModal for generation progress display
3. Converted Settings to modal-based interface
4. Added green "Saved" confirmation animation
5. Implemented 800ms delay before showing results

### Loading State Refactor
6. Removed inline loading UI from PromptView
7. Centralized loading display in modal
8. Added fast-path optimization for history reuse
9. Fixed modal timing for better UX

### Smart Generation Logic
10. Calculate `needFill` dynamically based on selected history
11. Skip modal when `needFill = 0` (instant display)
12. Adjust API calls to only generate needed recipes

---

## Known Patterns & Conventions

### Naming Conventions
- **State hooks**: `const [thing, setThing] = useState()`
- **Persisted state**: `const [thing, setThing, thingLoaded] = usePersistedState()`
- **Event handlers**: `handleActionName()`
- **CSS classes**: `camelCase` in CSS Modules, accessed via `styles.className`

### Component Structure
```jsx
import React from 'react';
import styles from './Component.module.css';

export function Component({ prop1, prop2 }) {
  // Hooks
  // Event handlers
  // Render logic
  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  );
}
```

### Data Transformation Pipeline
1. **API Response** (raw text)
2. **parseTabFormat()** → Structured object
3. **mergeParsedArray()** → Combined results
4. **combineParsed()** → Final meal plan
5. **Display** in React components

---

## Future Enhancement Ideas

### Potential Features
- Export meal plan to PDF
- Shopping list integration (e.g., Instacart API)
- Meal prep scheduling calendar
- Nutritional breakdown visualization
- Recipe rating and favorites system
- Image generation for recipes (Stable Diffusion)
- Multi-week planning
- Recipe scaling calculator
- Leftover tracking

### Technical Improvements
- TypeScript migration for type safety
- Service worker for offline support
- IndexedDB for larger storage capacity
- React Query for API state management
- Storybook for component documentation
- E2E testing with Playwright
- GitHub Actions CI/CD pipeline
- Progressive Web App (PWA) support

---

## Troubleshooting

### Common Issues

**API Calls Failing:**
- Check API key validity
- Verify Anthropic account has credits
- Check browser console for CORS errors
- Ensure `anthropic-dangerous-direct-browser-access` header present

**Recipes Not Parsing:**
- Check Claude response format in console
- Verify TAB delimiters in API response
- Update `parseTabFormat()` if format changed

**History Not Saving:**
- Check localStorage quota (usually 5-10MB)
- Verify JSON serialization not failing
- Check browser privacy settings (incognito mode clears on close)

**Modal Not Appearing:**
- Check z-index conflicts
- Verify `isOpen` prop being set to `true`
- Check for CSS issues (backdrop-filter support)

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Browser Compatibility

- **Recommended**: Chrome, Edge, Firefox, Safari (latest versions)
- **Required features**:
  - ES6+ JavaScript
  - CSS Grid and Flexbox
  - LocalStorage API
  - Fetch API
  - AbortController
  - CSS backdrop-filter (for modal blur)

---

## License & Credits

- Built with React and Vite
- Powered by Anthropic's Claude AI
- Design inspired by modern dark-mode UIs
- No external UI library dependencies (custom components)

---

## Contact & Support

For issues, questions, or contributions, refer to the project repository or contact the development team.

---

*Last Updated: March 2026*
*Documentation Version: 1.0*
