import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Modal } from '../Modal/Modal';
import { C } from '../../constants';
import { UI_CONFIG } from '../../config';
import styles from './LoadingModal.module.css';

export function LoadingModal({
  isOpen,
  stage,
  elapsed,
  progress,
  numDinners,
  onComplete
}) {
  const [showSuccess, setShowSuccess] = useState(false);
  const hasStartedClosingRef = useRef(false);

  const cssVars = useMemo(() => ({
    '--accent-color': C.accent,
    '--teal-color': C.teal,
    '--success-color': C.success
  }), []);

  // Check if all recipes are done
  const allDone = progress && progress.length > 0 && progress.every(p => p === true);

  // Trigger success animation when all done (only once per session)
  useEffect(() => {
    if (allDone && !hasStartedClosingRef.current && isOpen) {
      hasStartedClosingRef.current = true;
      setShowSuccess(true);

      // Wait 1 second, then call onComplete to close modal
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1000);
    }
  }, [allDone, isOpen, onComplete, showSuccess]);

  // Reset success state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowSuccess(false);
      hasStartedClosingRef.current = false;
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} closeOnBackdrop={false}>
      <div className={styles.loadingContainer} style={cssVars}>
        {showSuccess ? (
          <div className={styles.successCheckmark}>✓</div>
        ) : (
          <div className={styles.spinner}></div>
        )}
        <h2 className={styles.title}>
          {showSuccess ? 'All done!' : 'Loading your meals...'}
        </h2>

        {/* Always show progress section to maintain modal size */}
        <div className={styles.progressSection}>
          <p className={styles.progressText}>
            {showSuccess ? '\u00A0' : (stage ? `${stage} (${elapsed}s)` : '\u00A0')}
          </p>
        </div>

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
