import React, { useState, useMemo } from 'react';
import { C } from '../../constants';
import { Setting } from '../Setting/Setting';
import { Modal } from '../Modal/Modal';
import styles from './HeaderView.module.css';

export function HeaderView({
  numDinners,
  setNumDinners,
  numPeople,
  setNumPeople,
  calories,
  setCalories,
  isBatchEnabled,
  setIsBatchEnabled,
  numBatch,
  setNumBatch,
  batchServings,
  setBatchServings,
  selectedBatch,
  apiKey,
  setApiKey
}) {
  const [showSettings, setShowSettings] = useState(false);

  const cssVars = useMemo(() => ({
    '--muted-color': C.muted,
    '--teal-color': C.teal,
    '--border-color': C.border,
    '--button-bg': showSettings ? C.border : 'transparent'
  }), [showSettings]);

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

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)}>
        <Setting
          numDinners={numDinners}
          setNumDinners={setNumDinners}
          numPeople={numPeople}
          setNumPeople={setNumPeople}
          calories={calories}
          setCalories={setCalories}
          isBatchEnabled={isBatchEnabled}
          setIsBatchEnabled={setIsBatchEnabled}
          numBatch={numBatch}
          setNumBatch={setNumBatch}
          batchServings={batchServings}
          setBatchServings={setBatchServings}
          selectedBatch={selectedBatch}
          apiKey={apiKey}
          setApiKey={setApiKey}
          onClose={() => setShowSettings(false)}
        />
      </Modal>
    </>
  );
}
