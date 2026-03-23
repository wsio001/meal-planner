import React, { useMemo } from 'react';
import { C } from '../../constants';
import { PickerRow } from '../ui';
import { SETTINGS_CONFIG } from '../../config';
import styles from './Setting.module.css';

export function BatchCookToggle({
  enabled,
  numBatch,
  batchServings,
  selectedBatchCount,
  onToggle,
  onNumBatchChange,
  onBatchServingsChange
}) {
  const toggleContainerClass = `${styles.toggleContainer} ${enabled ? styles.on : styles.off}`;
  const toggleLabelClass = `${styles.toggleLabel} ${enabled ? styles.on : styles.off}`;
  const toggleStatusClass = `${styles.toggleStatus} ${enabled ? styles.on : styles.off}`;
  const toggleTrackClass = `${styles.toggleTrack} ${enabled ? styles.on : styles.off}`;
  const toggleThumbClass = `${styles.toggleThumb} ${enabled ? styles.on : styles.off}`;

  const cssVars = useMemo(() => ({
    '--teal-color': C.teal,
    '--teal-text': C.tealText,
    '--teal-dark': C.tealDark
  }), []);

  return (
    <div className={styles.settingsDivider}>
      <div className={styles.batchSettings}>
        <div
          onClick={onToggle}
          className={toggleContainerClass}
          style={cssVars}
        >
          <div>
            <span className={toggleLabelClass}>🍲 Batch Cook</span>
            <span className={toggleStatusClass}>
              {enabled ? 'Enabled' : 'Off — click to enable'}
            </span>
            {enabled && selectedBatchCount > 0 && (
              <span className={styles.toggleBadge}>
                {selectedBatchCount + ' from history'}
              </span>
            )}
          </div>
          <div className={toggleTrackClass}>
            <div className={toggleThumbClass} />
          </div>
        </div>
        {enabled && (
          <div className={styles.settingsRow}>
            <PickerRow
              label="🍲 Batch recipes"
              value={numBatch}
              setValue={onNumBatchChange}
              options={SETTINGS_CONFIG.BATCH_RECIPES_OPTIONS}
              ac={C.teal}
              bg={C.tealBg}
              tc={C.tealText}
            />
            <PickerRow
              label="🥣 Batch servings"
              value={batchServings}
              setValue={onBatchServingsChange}
              options={SETTINGS_CONFIG.BATCH_SERVINGS_OPTIONS}
              ac={C.teal}
              bg={C.tealBg}
              tc={C.tealText}
            />
          </div>
        )}
      </div>
    </div>
  );
}
