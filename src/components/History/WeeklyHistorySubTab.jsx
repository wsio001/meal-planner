import React, { useState, useEffect, useCallback } from 'react';
import { C, S } from '../../constants';
import { loadRecipes } from '../../data';
import { storage } from '../../storage';
import { STORAGE_KEYS, SIZE_CONFIG } from '../../config';
import { wouldConflictWithSelected } from '../../api';
import { HistoryTable } from './HistoryTable';
import { HistoryBar } from './HistoryBar';
import { LoadingSkeleton } from '../ui/LoadingSkeleton/LoadingSkeleton';
import { useRecipeHistory } from '../../contexts/RecipeHistoryContext';
import styles from './History.module.css';

export function WeeklyHistorySubTab({ numRecipes, mealsPerWeek, numPeople, servingsPerRecipe, calories, customRules, onViewMealPlan, apiKey }) {
  // Use recipe history from context
  const { selectedWeekly, setSelectedWeekly } = useRecipeHistory();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    loadRecipes(STORAGE_KEYS.RECIPES_ALL).then(r => {
      setAll(r);
      setLoading(false);
    });
  }, []);

  const toggleSel = useCallback(r => {
    setSelectedWeekly(prev => {
      const isAlreadySelected = prev.some(x => x.name === r.name);

      if (isAlreadySelected) {
        // Deselecting - always allowed
        return prev.filter(x => x.name !== r.name);
      } else {
        // Selecting - check conflicts and capacity
        if (prev.length >= numRecipes) {
          return prev; // Already at max
        }

        // Check if this recipe's cooking method conflicts with already selected
        if (wouldConflictWithSelected(r, prev)) {
          return prev; // Don't add - would cause conflict
        }

        return [...prev, r];
      }
    });
  }, [numRecipes, setSelectedWeekly]);

  const clearAll = useCallback(async () => {
    try {
      await storage.delete(STORAGE_KEYS.RECIPES_ALL);
    } catch (e) {}
    setAll([]);
    setSelectedWeekly([]);
    setConfirmClear(false);
  }, [setSelectedWeekly]);

  if (loading) {
    return <LoadingSkeleton type="table" />;
  }

  if (!all.length) {
    return (
      <div style={S.emptyState}>
        <p style={{ fontSize: SIZE_CONFIG.EMPTY_STATE_EMOJI_SIZE }}>📭</p>
        <p>No past weekly recipes yet.</p>
      </div>
    );
  }

  const barStyle = {
    '--badge-bg': C.accentBg,
    '--badge-text': C.accentText,
    '--muted-color': C.muted,
    '--dimmer-color': C.dimmer,
    '--danger-color': C.danger,
    '--warn-color': C.warn,
    '--border-color': C.border
  };

  return (
    <div>
      <HistoryBar
        selectedCount={selectedWeekly.length}
        maxSelect={numRecipes}
        onClearSelection={() => setSelectedWeekly([])}
        confirmClear={confirmClear}
        onConfirmClear={clearAll}
        onCancelClear={() => setConfirmClear(false)}
        onDeleteHistory={() => setConfirmClear(true)}
        labelText={'Select up to ' + numRecipes + ' recipes'}
        isBatch={false}
        cssVars={barStyle}
      />

      <div
        className={styles.selectedChips}
        style={{ '--chip-bg': C.accentBg, '--chip-accent': C.accent }}
      >
        {selectedWeekly.length > 0 ? (
          selectedWeekly.map((r, i) => (
            <div key={r.id || r.name + '_' + i} className={styles.chip}>
              <span className={styles.chipNumber}>{'#' + (i + 1)}</span>
              {' ' + r.name}
              <span onClick={() => toggleSel(r)} className={styles.chipClose}>
                ×
              </span>
            </div>
          ))
        ) : (
          <div style={{ minHeight: `${SIZE_CONFIG.CHIP_MIN_HEIGHT}px` }} />
        )}
      </div>

      <HistoryTable
        rows={all}
        selected={selectedWeekly}
        onToggle={toggleSel}
        maxSelect={numRecipes}
        acColor={C.accent}
        acBg={C.accentBg}
        acText={C.accentText}
        checkDark={false}
        disabled={false}
        isRecipeDisabled={(recipe) => {
          const isSelected = selectedWeekly.some(x => x.name === recipe.name);
          return !isSelected && wouldConflictWithSelected(recipe, selectedWeekly);
        }}
      />
    </div>
  );
}
