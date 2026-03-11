import React from 'react';
import { Modal } from '../Modal/Modal';
import { C } from '../../constants';
import { UI_CONFIG } from '../../config';
import styles from './LoadingModal.module.css';

export function LoadingModal({
  isOpen,
  stage,
  elapsed,
  progress,
  numDinners
}) {
  const cssVars = {
    '--accent-color': C.accent,
    '--teal-color': C.teal
  };

  return (
    <Modal isOpen={isOpen} closeOnBackdrop={false}>
      <div className={styles.loadingContainer} style={cssVars}>
        <div className={styles.spinner}></div>
        <h2 className={styles.title}>Loading your meals...</h2>

        {stage && (
          <div className={styles.progressSection}>
            <p className={styles.progressText}>{stage} ({elapsed}s)</p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: Math.min((elapsed / UI_CONFIG.PROGRESS_DENOMINATOR) * 100, UI_CONFIG.PROGRESS_MAX_PERCENT) + '%'
                }}
              />
            </div>
          </div>
        )}

        {progress && progress.length > 0 && (
          <div className={styles.progressGrid}>
            {progress.map((done, i) => {
              const isBatch = i >= numDinners;
              const itemClass = `${styles.progressItem} ${
                done ? (isBatch ? styles.doneBatch : styles.done) : styles.pending
              }`;
              return (
                <div key={i} className={itemClass}>
                  {done ? '✓' : '⏳'}{' '}
                  {isBatch ? 'Batch ' + (i - numDinners + 1) : 'Recipe ' + (i + 1)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
