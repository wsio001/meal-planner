import React from 'react';
import styles from './SectionHeader.module.css';

export const SectionHeader = React.memo(function SectionHeader({ color, label }) {
  const cssVars = {
    '--section-border': color + '44',
    '--section-color': color
  };

  return (
    <div className={styles.sectionHeader} style={cssVars}>
      <span className={styles.sectionHeaderLabel}>{label}</span>
    </div>
  );
});
