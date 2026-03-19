import React, { useState, useMemo } from 'react';
import { C } from '../../constants';
import { Setting } from '../Setting/Setting';
import { Modal } from '../Modal/Modal';
import { useSettings } from '../../contexts/SettingsContext';
import styles from './HeaderView.module.css';

export function HeaderView({ selectedBatch, onNavigateToHistory }) {
  const { numDinners, numPeople, calories, isBatchEnabled, numBatch, batchServings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const cssVars = useMemo(() => ({
    '--muted-color': C.muted,
    '--teal-color': C.teal,
    '--border-color': C.border,
    '--button-bg': showSettings ? C.border : 'transparent'
  }), [showSettings]);

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <>
      <div className={styles.headerContainer} style={cssVars}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>🍽️ Weekly Meal Planner</h1>
          <p className={styles.summary}>
            {numDinners + ' dinner' + (numDinners > 1 ? 's' : '') + ' · ' + numPeople + ' ' + (numPeople > 1 ? 'people' : 'person') + ' · 🔥 ' + calories + ' cal'}
            {isBatchEnabled && (
              <span className={styles.batchInfo}>
                {'· 🍲 Batch ×' + numBatch + ' (' + batchServings + ' srv)'}
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setShowSettings(v => !v)} className={styles.settingsButton}>
          ⚙️
        </button>
      </div>

      <Modal isOpen={showSettings} onClose={handleCloseSettings}>
        <Setting
          selectedBatch={selectedBatch}
          onClose={handleCloseSettings}
          onGoToHistory={() => {
            // Navigate first for crisp transition, then close modal
            if (onNavigateToHistory) {
              onNavigateToHistory();
            }
            handleCloseSettings();
          }}
        />
      </Modal>
    </>
  );
}
