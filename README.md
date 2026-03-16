# 🍽️ Weekly Meal Planner

An AI-powered meal planning app that generates personalized weekly dinner plans using Claude AI. Create customized meal plans with varied cuisines, manage recipe history, and get organized grocery lists—all tailored to your dietary preferences.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/react-18.3.0-61dafb)
![Vite](https://img.shields.io/badge/vite-5.4.0-646cff)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### 🤖 AI-Powered Recipe Generation
- **Smart Recipe Creation**: Generates unique dinner recipes using Claude AI (Anthropic)
- **Diverse Cuisines**: Randomly selects from 20 cuisines (Japanese, Mexican, Italian, Thai, Korean, Indian, Mediterranean, Chinese, Vietnamese, American, Moroccan, Greek, Brazilian, Turkish, Ethiopian, Peruvian, Spanish, Lebanese, Indonesian, Cajun)
- **Customizable Preferences**:
  - Number of dinners per week (2-7)
  - Servings per meal (1-6 people)
  - Calories per serving (300-1500 kcal)
- **Special Requests**: Add one-time requests like "use salmon from my fridge" or "include a steak dinner"

### 🍲 Batch Cooking Support
- **Meal Prep Friendly**: Generate batch cooking recipes optimized for storage and reheating
- **Flexible Servings**: Create large batches (8-20 servings) for meal prep
- **Recipe Selection**: Mix weekly dinners with batch-cooked meals
- **Separate History**: Track batch recipes separately from regular dinners

### 📖 Recipe History & Reuse
- **Save All Recipes**: Every generated recipe is automatically saved to history
- **Browse & Search**: Review all past recipes (weekly and batch)
- **Reuse Favorites**: Select recipes from history to include in new meal plans
- **Smart Generation**: Only generates new recipes for the remaining slots
- **Delete Unwanted**: Remove recipes you don't want to keep

### 🛒 Grocery Management
- **Consolidated Shopping List**: Automatically combines ingredients across all recipes
- **Categorized by Type**: Organized into Produce, Protein/Meat, Pantry, Dairy, Grains, Spices
- **Quantity Tracking**: Shows amounts needed for each ingredient
- **Recipe Attribution**: See which recipes use each ingredient
- **iPhone Notes Format**: Export-ready format for easy shopping

### 🎨 Modern User Interface
- **Dark Mode Design**: Easy-on-the-eyes dark theme
- **Modal Dialogs**: Settings and loading states in smooth modal overlays
- **Real-time Progress**: Watch recipes generate with live progress indicators
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Polished transitions and feedback

### 🔒 Privacy & Security
- **Local Storage**: All data stays in your browser
- **Your API Key**: Bring your own Anthropic API key
- **No Backend**: Direct browser-to-Anthropic communication
- **No Account Required**: No sign-up, no tracking

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/meal-planner.git
cd meal-planner

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### First Time Setup

1. **Enter API Key**: Click the gear icon (⚙️) in the top-right corner
2. **Add Your Anthropic API Key**: Paste your API key in the settings modal
3. **Configure Preferences** (optional):
   - Dinners per week
   - People per dinner
   - Calories per serving
   - Enable/disable batch cooking
4. **Click Save**: Settings are saved locally in your browser

---

## 📱 How to Use

### Generate a New Meal Plan

1. **Navigate to "This Week" tab** (default view)
2. **Add special requests** (optional): e.g., "one meal should include chicken" or "avoid seafood"
3. **Edit dietary rules** (optional): Customize default rules like "high protein" or "keto-friendly"
4. **Click "✨ Hit Me With A Plan"**: Watch the AI generate your recipes!
5. **View Results**: See recipes, grocery list, and iPhone notes format

### Reuse Recipes from History

1. **Navigate to "History" tab**
2. **Select subtab**: "Weekly Recipes" or "Batch Cook Recipes"
3. **Check recipes** you want to reuse (up to your weekly dinner count)
4. **Click "✨ Reuse Meals"** or "✨ Cook X More Meals"
5. **View combined plan**: Selected recipes + newly generated recipes

### View Recipe Details

Each recipe includes:
- **Name & Cuisine**: e.g., "Thai Green Curry" - Thai cuisine
- **Cook Time**: Total preparation and cooking time
- **Calories**: Per serving calorie count
- **Ingredients**: Full ingredient list with amounts
- **Cooking Workflow**: Step-by-step timeline (0:00, 0:05, 0:10, etc.)
- **Keto Notes**: Keto-friendly swaps (if using default dietary rules)

### Manage Grocery List

- **View by Category**: Ingredients grouped by type (Produce, Protein, etc.)
- **Copy to Clipboard**: Click "Copy iPhone Format" for easy shopping list
- **See Recipe Links**: Each ingredient shows which recipes use it

---

## ⚙️ Configuration

### Dietary Rules (Customizable)

Default rules include:
- High protein, high fiber
- Mild spice only
- Standard supermarket ingredients
- Keto/normal portions (one portion low-carb, one normal)
- Clear keto swap notes

You can customize these in the "Custom Dietary Rules" section when generating meals.

### Settings Options

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| **Dinners / week** | 2-7 | 3 | Number of dinner recipes to generate |
| **People / dinner** | 1-6 | 2 | Servings per recipe |
| **Calories / serving** | 300-1500 | 750 | Target calories per serving |
| **Batch recipes** | 1-4 | 2 | Number of batch cooking recipes (when enabled) |
| **Batch servings** | 8-20 | 15 | Servings per batch recipe |

---

## 🏗️ Technical Stack

- **Frontend**: React 18.3.0 with Hooks
- **Build Tool**: Vite 5.4.0
- **Styling**: CSS Modules (scoped styles)
- **AI**: Anthropic Claude API (Haiku 4.5 model)
- **Storage**: Browser localStorage
- **State Management**: React hooks (useState, useCallback, custom hooks)

---

## 📂 Project Structure

```
meal-planner/
├── src/
│   ├── components/          # React components
│   │   ├── Modal/           # Reusable modal
│   │   ├── LoadingModal/    # Loading state modal
│   │   ├── HeaderView/      # App header with settings
│   │   ├── TabView/         # Tab navigation
│   │   ├── PromptView/      # Recipe generation UI
│   │   ├── ThisWeekTab/     # Current meal plan view
│   │   ├── History/         # Recipe history manager
│   │   ├── Setting/         # Settings panel
│   │   └── ui/              # Reusable UI components
│   ├── api.js               # Claude API integration
│   ├── data.js              # Data parsing and storage
│   ├── config.js            # App configuration
│   ├── constants.js         # Colors, cuisines, defaults
│   ├── hooks.js             # Custom React hooks
│   ├── storage.js           # localStorage adapter
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── CLAUDE.md                # Technical documentation
└── REFACTORING_GUIDE.md     # Development roadmap
```

---

## 🎯 How It Works

### Recipe Generation Flow

1. **User clicks "Generate"** → App picks random cuisines
2. **Builds AI prompts** → Includes dietary rules, special requests, calorie targets
3. **Parallel API calls** → Up to 3 concurrent requests to Claude API
4. **Parses responses** → Extracts recipes, ingredients, grocery items from TAB-delimited format
5. **Retry logic** → Re-requests any missing recipes (shortfall recovery)
6. **Combines data** → Merges weekly + batch + history recipes
7. **Saves to history** → Stores new recipes locally (with deduplication)
8. **Displays results** → Shows recipes, grocery list, and notes

### Smart Features

**Fast Path Optimization**: When reusing all meals from history (no new generation needed), the app skips the loading modal for instant display.

**Progress Tracking**: Real-time updates show which recipes are completed during generation.

**Error Handling**: Automatic retry with exponential backoff if API calls fail.

---

## 💾 Data Storage

All data is stored locally in your browser using localStorage:

- **API Key**: Stored locally (never sent anywhere except Anthropic API)
- **Settings**: Dinners, servings, calories, batch preferences
- **Custom Rules**: Your dietary preferences and restrictions
- **Recipe History**: All generated recipes (weekly and batch)
- **Current Meal Plan**: Last generated plan

**Storage Limits**: ~5-10MB depending on browser (hundreds of recipes)

---

## 🔧 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Configuration

Edit `/src/config.js` to modify:
- API timeout and retry settings
- UI thresholds and animations
- Default values for settings
- Storage keys

---

## 🐛 Troubleshooting

### "Invalid API Key" Error
- Verify your Anthropic API key is correct
- Check that your account has available credits
- Ensure the key hasn't expired

### Recipes Not Generating
- Check browser console for errors
- Verify internet connection
- Try refreshing the page
- Clear localStorage and re-enter API key

### History Not Saving
- Check available localStorage space (browser DevTools)
- Verify you're not in incognito/private mode (clears on close)
- Try clearing old history to free up space

### Modal Not Appearing
- Check if another modal is already open
- Refresh the page to reset state
- Check browser console for JavaScript errors

---

## 🔐 Security & Privacy

### Your Data is Safe
- **No Backend**: All processing happens in your browser
- **No Tracking**: No analytics, no telemetry, no data collection
- **Local Storage Only**: Data never leaves your device (except API calls to Anthropic)
- **Open Source**: Inspect the code yourself

### API Key Security
- Stored in browser localStorage only
- Never transmitted to any server except Anthropic's API
- Direct browser-to-Anthropic communication
- You control your API usage and costs

### Recommended Practices
- Don't share your API key with anyone
- Monitor your Anthropic API usage/costs
- Keep your browser updated for security patches
- Use strong, unique Anthropic account password

---

## 📊 Performance

- **Generation Speed**: ~15-30 seconds for 3 recipes (depends on API response time)
- **Parallel Processing**: Up to 3 concurrent API calls for faster generation
- **Smart Caching**: Recipe history enables instant reuse
- **Optimized Bundle**: Fast initial load with code splitting

---

## 🛣️ Roadmap

See [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md) for planned improvements:

- ✅ Modal system with loading states
- ✅ Config centralization
- 🎯 Accessibility improvements (ARIA labels, keyboard navigation)
- 🎯 Toast notifications for user feedback
- 🎯 Enhanced error handling
- 🎯 Settings Context (eliminate prop drilling)
- 🎯 Loading skeletons for better UX
- 💡 PDF export for meal plans
- 💡 Shopping list integration (Instacart API)
- 💡 Recipe rating and favorites
- 💡 Multi-week planning

---

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🙏 Credits

- **AI Model**: Powered by [Anthropic's Claude](https://www.anthropic.com/)
- **Built with**: React + Vite
- **Design**: Custom dark-mode UI with CSS Modules
- **Icons**: Emoji icons for accessibility

---

## 📧 Support

For bugs, feature requests, or questions:
- Open an issue on GitHub
- Check [CLAUDE.md](CLAUDE.md) for technical documentation
- Review [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md) for development roadmap

---

## 🌟 Show Your Support

If you find this project helpful:
- ⭐ Star the repository
- 🍴 Fork and customize for your needs
- 🐛 Report bugs or suggest features
- 📢 Share with friends who meal prep!

---

**Made with ❤️ and Claude AI**

*Last Updated: March 16, 2026*
