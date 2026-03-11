import React from 'react';
import styles from './GenerateButton.module.css';

export const GenerateButton = React.memo(function GenerateButton({
  onClick,
  label,
  disabled
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={styles.generateButton}
    >
      {label}
    </button>
  );
});
