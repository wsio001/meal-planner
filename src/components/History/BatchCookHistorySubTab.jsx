import React, { useState, useEffect, useCallback } from 'react';
import { C, S } from '../../constants';
import { loadRecipes } from '../../data';
import { storage } from '../../storage';
import { STORAGE_KEYS, SIZE_CONFIG } from '../../config';
import { HistoryTable } from './HistoryTable';
import { HistoryBar } from './HistoryBar';
import { LoadingSkeleton } from '../ui/LoadingSkeleton/LoadingSkeleton';
import { useRecipeHistory } from '../../contexts/RecipeHistoryContext';
import styles from './History.module.css';

export function BatchCookHistorySubTab({
  batchCookEnabled,
  numBatchCook
}) {
  // Use recipe history from context
  const { selectedBatch, setSelectedBatch } = useRecipeHistory();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    loadRecipes(STORAGE_KEYS.RECIPES_BATCH).then(r => {
      setAll(r);
      setLoading(false);
    });
  }, []);

  const toggleSel = useCallback(recipe => {
    if (!batchCookEnabled) return;
    setSelectedBatch(prev =>
      prev.some(r => r.name === recipe.name)
        ? prev.filter(r => r.name !== recipe.name)
        : prev.length < numBatchCook
          ? [...prev, { ...recipe, isBatchCook: true }]
          : prev
    );
  }, [batchCookEnabled, numBatchCook, setSelectedBatch]);

  const clearAll = useCallback(async () => {
    try {
      await storage.delete(STORAGE_KEYS.RECIPES_BATCH);
    } catch (e) {}
    setAll([]);
    setSelectedBatch([]);
    setConfirmClear(false);
  }, [setSelectedBatch]);

  if (loading) {
    return <LoadingSkeleton type="table" />;
  }

  if (!all.length) {
    return (
      <div style={S.emptyState}>
        <p style={{ fontSize: SIZE_CONFIG.EMPTY_STATE_EMOJI_SIZE }}>🍲</p>
        <p>No batch cook recipes saved yet.</p>
        <p style={{ fontSize: 12 }}>
          Enable Batch Cook in Setting to create your first batch recipes.
        </p>
      </div>
    );
  }

  const batchStyle = {
    '--bg-darker': C.bgDarker || '#0a0e1a',
    '--border-color': C.border,
    '--muted-color': C.muted,
    '--teal-text': C.tealText,
    '--teal-color': C.teal,
    '--teal-dark': C.tealDark,
    '--chip-accent': C.teal,
    '--chip-bg': C.tealBg,
    '--danger-color': C.danger,
    '--warn-color': C.warn,
    '--dimmer-color': C.dimmer,
    '--badge-bg': C.tealDark,
    '--badge-text': C.tealText
  };

  return (
    <div style={batchStyle}>
      {!batchCookEnabled ? (
        <div className={styles.batchOffBar}>
          🔒 Enable <strong>Batch Cook</strong> in Setting to select recipes.
        </div>
      ) : (
        <HistoryBar
          selectedCount={selectedBatch.length}
          maxSelect={numBatchCook}
          onClearSelection={() => setSelectedBatch([])}
          confirmClear={confirmClear}
          onConfirmClear={clearAll}
          onCancelClear={() => setConfirmClear(false)}
          onDeleteHistory={() => setConfirmClear(true)}
          labelText={'Select up to ' + numBatchCook + ' batch recipe' + (numBatchCook > 1 ? 's' : '')}
          isBatch={true}
          cssVars={batchStyle}
        />
      )}

      {batchCookEnabled && (
        <div className={styles.selectedChips}>
          {selectedBatch.length > 0 ? (
            selectedBatch.map((r, i) => (
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
      )}

      <HistoryTable
        rows={all}
        selected={selectedBatch}
        onToggle={toggleSel}
        maxSelect={numBatchCook}
        acColor={C.teal}
        acBg={C.tealBg}
        acText={C.tealText}
        checkDark={true}
        disabled={!batchCookEnabled}
      />
    </div>
  );
}
