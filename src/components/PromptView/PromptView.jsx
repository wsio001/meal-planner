import { useState } from 'react';
import { C } from '../../constants';
import { GenerateButton } from '../ui';
import { RulesEditor } from '../RulesEditor/RulesEditor';
import styles from './PromptView.module.css';

export function PromptView({
  onGenerate,
  loading,
  error,
  customRules,
  setCustomRules,
  numPeople,
  calories,
  rulesLoaded,
  isBatchEnabled
}) {
  const [specialRequest, setSpecialRequest] = useState('');

  const buttonLabel = loading
    ? '✨ Cooking...'
    : '✨ Hit Me With A Plan ( Meals' + (isBatchEnabled ? ' + Batch )' : ' Only )');

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
