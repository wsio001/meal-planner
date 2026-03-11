import React, { useState } from 'react';
import { C } from '../../../constants';
import { GenerateButton } from '../GenerateButton/GenerateButton';
import styles from './SpecialRequestInput.module.css';

export const SpecialRequestInput = React.memo(function SpecialRequestInput({ onSubmit, buttonLabel, disabled }) {
  const [val, setVal] = useState('');

  const cssVars = {
    '--muted-color': C.muted,
    '--dimmer-color': C.dimmer,
    '--bg-color': C.bg,
    '--text-color': C.text,
    '--border-color': C.border
  };

  return (
    <div style={cssVars}>
      <label className={styles.specialRequestLabel}>
        One-time special requests <span className={styles.specialRequestOptional}>(optional)</span>
      </label>
      <textarea
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder='e.g. "one meal should be steak and egg", "help me use the salmon in my fridge"'
        className={styles.specialRequestTextarea}
      />
      <GenerateButton onClick={() => onSubmit(val)} label={buttonLabel} disabled={disabled} />
    </div>
  );
});
