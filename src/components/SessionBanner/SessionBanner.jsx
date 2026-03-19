import React, { useMemo } from 'react';
import styles from './SessionBanner.module.css';

export function SessionBanner() {
  const cssVars = useMemo(() => ({
    '--warn-color': '#f59e0b',
    '--warn-bg': '#78350f',
    '--warn-border': '#d97706'
  }), []);

  return (
    <div className={styles.banner} style={cssVars}>
      <span className={styles.icon}>⚠️</span>
      <div className={styles.content}>
        <strong>Session-Only Mode:</strong> Storage is disabled in your browser. Settings will not persist after closing this page.
      </div>
    </div>
  );
}
