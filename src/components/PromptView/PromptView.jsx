import React from 'react';
import { C } from '../../constants';
import { SpecialRequestInput } from '../ui/ui';
import { RulesEditor } from '../RulesEditor/RulesEditor';
import styles from './PromptView.module.css';

export function PromptView({
  onGenerate,
  buttonLabel,
  loading,
  stage,
  elapsed,
  progress,
  numDinners,
  error,
  customRules,
  setCustomRules,
  numPeople,
  calories,
  rulesLoaded
}) {
  const cssVars = {
    '--dim-color': C.dim,
    '--warn-color': C.warn
  };

  return (
    <div className={styles.generatePanel} style={cssVars}>
      <SpecialRequestInput onSubmit={onGenerate} buttonLabel={buttonLabel} disabled={loading} />

      {loading && (
        <div className={styles.progressSection}>
          <div className={styles.progressMeta}>
            <p className={styles.progressText}>{stage + ' (' + elapsed + 's)'}</p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressBarFill}
                style={{ width: Math.min((elapsed / 75) * 100, 95) + '%' }}
              />
            </div>
          </div>
          <div className={styles.progressRow}>
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
        </div>
      )}

      {error && <p className={styles.errorMessage}>{error}</p>}

      {rulesLoaded && (
        <RulesEditor
          customRules={customRules}
          setCustomRules={setCustomRules}
          numPeople={numPeople}
          calories={calories}
        />
      )}
    </div>
  );
}
