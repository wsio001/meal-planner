import React, { useMemo } from 'react';
import { C } from '../../constants';
import { PickerRow } from '../ui';
import { SETTINGS_CONFIG } from '../../config';
import styles from './Setting.module.css';

export function EquipmentSettings({
  stovetopBurners,
  hasOven,
  hasAirFryer,
  hasPressureCooker,
  hasSousVide,
  onStoretopBurnersChange,
  onHasOvenChange,
  onHasAirFryerChange,
  onHasPressureCookerChange,
  onHasSousVideChange
}) {
  const cssVars = useMemo(() => ({
    '--accent-color': C.accent
  }), []);

  return (
    <div className={styles.settingsDivider}>
      <div className={styles.equipmentSettings}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>🍳 Kitchen Equipment</span>
          <span className={styles.sectionSubtitle}>
            Used for smart concurrent cooking schedules
          </span>
        </div>

        <div className={styles.settingsRow}>
          <PickerRow
            label="🔥 Stovetop burners"
            value={stovetopBurners}
            setValue={onStoretopBurnersChange}
            options={SETTINGS_CONFIG.STOVETOP_BURNERS_OPTIONS}
            ac={C.accent}
            bg={C.accentBg}
            tc={C.accentText}
          />
        </div>

        <div className={styles.equipmentCheckboxGrid}>
          <label className={styles.equipmentCheckbox}>
            <input
              type="checkbox"
              checked={hasOven}
              onChange={(e) => onHasOvenChange(e.target.checked)}
            />
            <span className={styles.checkboxLabel}>🔥 Oven</span>
          </label>

          <label className={styles.equipmentCheckbox}>
            <input
              type="checkbox"
              checked={hasAirFryer}
              onChange={(e) => onHasAirFryerChange(e.target.checked)}
            />
            <span className={styles.checkboxLabel}>💨 Air Fryer</span>
          </label>

          <label className={styles.equipmentCheckbox}>
            <input
              type="checkbox"
              checked={hasPressureCooker}
              onChange={(e) => onHasPressureCookerChange(e.target.checked)}
            />
            <span className={styles.checkboxLabel}>⚡ Pressure Cooker</span>
          </label>

          <label className={styles.equipmentCheckbox}>
            <input
              type="checkbox"
              checked={hasSousVide}
              onChange={(e) => onHasSousVideChange(e.target.checked)}
            />
            <span className={styles.checkboxLabel}>🌡️ Sous Vide</span>
          </label>
        </div>
      </div>
    </div>
  );
}
