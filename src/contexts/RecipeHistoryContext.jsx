import React, { createContext, useContext, useState, useCallback } from 'react';

const RecipeHistoryContext = createContext(null);

export function RecipeHistoryProvider({ children }) {
  // Selected recipes for weekly meal plan
  const [selectedWeekly, setSelectedWeekly] = useState([]);

  // Selected recipes for batch cooking
  const [selectedBatch, setSelectedBatch] = useState([]);

  // Clear all weekly selections
  const clearWeeklySelection = useCallback(() => {
    setSelectedWeekly([]);
  }, []);

  // Clear all batch selections
  const clearBatchSelection = useCallback(() => {
    setSelectedBatch([]);
  }, []);

  const value = {
    // Weekly selection state
    selectedWeekly,
    setSelectedWeekly,
    clearWeeklySelection,

    // Batch selection state
    selectedBatch,
    setSelectedBatch,
    clearBatchSelection,
  };

  return (
    <RecipeHistoryContext.Provider value={value}>
      {children}
    </RecipeHistoryContext.Provider>
  );
}

export function useRecipeHistory() {
  const context = useContext(RecipeHistoryContext);
  if (!context) {
    throw new Error('useRecipeHistory must be used within a RecipeHistoryProvider');
  }
  return context;
}
