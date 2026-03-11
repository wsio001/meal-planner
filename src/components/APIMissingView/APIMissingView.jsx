import React from 'react';
import { C } from '../../constants';
import styles from './APIMissingView.module.css';

export function APIMissingView() {
  const cssVars = {
    '--warn-color': C.warn,
    '--muted-color': C.muted,
    '--border-color': C.border
  };

  return (
    <div className={styles.missingPanel} style={cssVars}>
      <div className={styles.iconContainer}>
        <span className={styles.icon}>🔑</span>
      </div>
      <h2 className={styles.title}>API Key Required</h2>
      <p className={styles.message}>
        To use the Meal Planner, please add your Anthropic API key in the Settings.
      </p>
      <p className={styles.instructions}>
        Click the <strong>⚙️ Settings</strong> button above and enter your API key to get started.
      </p>
      <div className={styles.infoBox}>
        <p className={styles.infoTitle}>Don't have an API key?</p>
        <p className={styles.infoText}>
          Visit{' '}
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            console.anthropic.com
          </a>{' '}
          to get your API key.
        </p>
      </div>
    </div>
  );
}
