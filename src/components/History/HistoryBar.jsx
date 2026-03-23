import React from 'react';
import styles from './History.module.css';

export function HistoryBar({
  selectedCount,
  maxSelect,
  onClearSelection,
  confirmClear,
  onConfirmClear,
  onCancelClear,
  onDeleteHistory,
  labelText,
  isBatch = false,
  cssVars
}) {
  return (
    <div className={styles.historyBar} style={cssVars}>
      <div className={styles.historyBarInfo}>
        <span className={isBatch ? styles.batchLabel : styles.historyBarLabel}>
          {labelText}
        </span>
        <span className={isBatch ? styles.batchBadge : styles.historyBarBadge}>
          {selectedCount + ' / ' + maxSelect}
        </span>
        {selectedCount > 0 && (
          <button
            onClick={onClearSelection}
            className={styles.clearButton}
          >
            {selectedCount === 1 ? 'Clear Selection' : 'Clear Selections'}
          </button>
        )}
      </div>
      <div className={styles.historyBarButtons}>
        {confirmClear ? (
          <div className={styles.confirmRow}>
            <span className={styles.confirmText}>Sure?</span>
            <button onClick={onConfirmClear} className={styles.confirmYesButton}>
              Yes
            </button>
            <button
              onClick={onCancelClear}
              className={styles.confirmCancelButton}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onDeleteHistory}
            className={styles.deleteButton}
          >
            🗑 Delete History
          </button>
        )}
      </div>
    </div>
  );
}
