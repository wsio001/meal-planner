import { useState } from 'react';
import { C } from '../../constants';
import { GenerateButton } from '../ui';
import { RulesEditor } from '../RulesEditor/RulesEditor';
import styles from './PromptView.module.css';

export function PromptView({
  onGenerate,
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
  rulesLoaded,
  batchEnabled
}) {
  const [specialRequest, setSpecialRequest] = useState('');

  const buttonLabel = loading
    ? '✨ Cooking...'
    : '✨ Hit Me With A Plan ( Meals' + (batchEnabled ? ' + Batch )' : ' Only )');

  const cssVars = {
    '--dim-color': C.dim,
    '--warn-color': C.warn,
    '--muted-color': C.muted,
    '--dimmer-color': C.dimmer,
    '--bg-color': C.bg,
    '--text-color': C.text,
    '--border-color': C.border
  };

  return (
    <div className={styles.generatePanel} style={cssVars}>
      <label className={styles.specialRequestLabel}>
        One-time special requests <span className={styles.specialRequestOptional}>(optional)</span>
      </label>
      <textarea
        value={specialRequest}
        onChange={e => setSpecialRequest(e.target.value)}
        placeholder='e.g. "one meal should be steak and egg", "help me use the salmon in my fridge"'
        className={styles.specialRequestTextarea}
      />
      <GenerateButton onClick={() => onGenerate(specialRequest)} label={buttonLabel} disabled={loading} />

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
