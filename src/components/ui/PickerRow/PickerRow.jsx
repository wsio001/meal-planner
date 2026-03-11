import React from 'react';
import { C } from '../../../constants';
import styles from './PickerRow.module.css';

export const PickerRow = React.memo(function PickerRow({ label, value, setValue, options, ac, bg, tc }) {
  const acC = ac || C.accent;
  const bgC = bg || C.accentBg;
  const tcC = tc || C.accentText;

  const cssVars = {
    '--muted-color': C.muted
  };

  return (
    <div className={styles.pickerContainer} style={cssVars}>
      <label className={styles.pickerLabel}>{label}</label>
      <div className={styles.pickerOptions}>
        {options.map(n => {
          const buttonStyle = {
            '--button-border': value === n ? acC : C.border,
            '--button-bg': value === n ? bgC : C.bg,
            '--button-color': value === n ? tcC : C.dim,
            '--button-weight': value === n ? 700 : 400
          };
          return (
            <button
              key={n}
              onClick={() => setValue(n)}
              className={styles.pickerButton}
              style={buttonStyle}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
});
