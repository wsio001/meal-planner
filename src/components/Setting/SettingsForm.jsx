import React from 'react';
import { PickerRow, CalorieInput } from '../ui';
import { SETTINGS_CONFIG } from '../../config';
import styles from './Setting.module.css';

export function SettingsForm({
  numDinners,
  numPeople,
  calories,
  onNumDinnersChange,
  onNumPeopleChange,
  onCaloriesChange
}) {
  return (
    <div className={styles.settingsRow}>
      <PickerRow
        label="🍽️ Dinners / week"
        value={numDinners}
        setValue={onNumDinnersChange}
        options={SETTINGS_CONFIG.DINNERS_OPTIONS}
      />
      <PickerRow
        label="👥 People / dinner"
        value={numPeople}
        setValue={onNumPeopleChange}
        options={SETTINGS_CONFIG.PEOPLE_OPTIONS}
      />
      <CalorieInput
        calories={calories}
        setCalories={onCaloriesChange}
      />
    </div>
  );
}
