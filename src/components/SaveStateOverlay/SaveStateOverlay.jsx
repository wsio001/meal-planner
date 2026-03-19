import React, { useMemo } from 'react';
import { C } from '../../constants';
import styles from './SaveStateOverlay.module.css';

export function SaveStateOverlay({
  state, // 'saving' | 'success' | 'warning' | 'error'
  message,
  detail,
  onRetry,
  onGoToHistory,
  onClose
}) {
  const cssVars = useMemo(() => ({
    '--success-bg': C.successBg,
    '--success-color': C.success,
    '--warn-color': '#f59e0b',
    '--warn-bg': '#78350f',
    '--error-color': '#fca5a5',
    '--error-bg': '#4c1d1d',
    '--spinner-color': C.dim
  }), []);

  if (!state) return null;

  return (
    <div className={styles.overlay} style={cssVars}>
      <div className={styles.content}>
        {state === 'saving' && (
          <>
            <div className={styles.spinner}></div>
            <p className={styles.message}>{message || 'Saving...'}</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className={`${styles.icon} ${styles.success}`}>✓</div>
            <p className={styles.message}>{message || 'Saved'}</p>
          </>
        )}

        {state === 'warning' && (
          <>
            <div className={`${styles.icon} ${styles.warning}`}>⚠</div>
            <p className={styles.message}>{message || 'Warning'}</p>
            {detail && <p className={styles.detail}>{detail}</p>}
            {onClose && (
              <button onClick={onClose} className={styles.button}>
                Got It
              </button>
            )}
          </>
        )}

        {state === 'error' && (
          <>
            <div className={`${styles.icon} ${styles.error}`}>✗</div>
            <p className={styles.message}>{message || 'Error occurred'}</p>
            {detail && <p className={styles.detail}>{detail}</p>}
            <div className={styles.buttonGroup}>
              {onGoToHistory && (
                <button onClick={onGoToHistory} className={styles.button}>
                  Go to History
                </button>
              )}
              {onRetry && (
                <button onClick={onRetry} className={styles.button}>
                  Try Again
                </button>
              )}
              {onClose && !onRetry && !onGoToHistory && (
                <button onClick={onClose} className={styles.button}>
                  Close
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
