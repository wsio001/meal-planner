import React from 'react';
import { PickerRow, CalorieInput } from '../ui';
import { SETTINGS_CONFIG } from '../../config';
import styles from './Setting.module.css';

export function SettingsForm({
  numRecipes,
  mealsPerWeek,
  numPeople,
  calories,
  totalServings,
  servingsPerRecipe,
  onNumRecipesChange,
  onMealsPerWeekChange,
  onNumPeopleChange,
  onCaloriesChange
}) {
  return (
    <>
      <div className={styles.settingsRow}>
        <PickerRow
          label="📅 Meals / week"
          value={mealsPerWeek}
          setValue={onMealsPerWeekChange}
          options={SETTINGS_CONFIG.MEALS_PER_WEEK_OPTIONS}
        />
        <PickerRow
          label="👥 People / meal"
          value={numPeople}
          setValue={onNumPeopleChange}
          options={SETTINGS_CONFIG.PEOPLE_OPTIONS}
        />
        <CalorieInput
          calories={calories}
          setCalories={onCaloriesChange}
        />
      </div>
      <div className={styles.settingsRow}>
        <PickerRow
          label="🍳 Different recipes"
          value={numRecipes}
          setValue={onNumRecipesChange}
          options={SETTINGS_CONFIG.NUM_RECIPES_OPTIONS}
        />
        <div className={styles.calculatedInfo}>
          <div className={styles.calculatedLabel}>Total servings needed</div>
          <div className={styles.calculatedValue}>{totalServings}</div>
        </div>
        <div className={styles.calculatedInfo}>
          <div className={styles.calculatedLabel}>Servings per recipe</div>
          <div className={styles.calculatedValue}>{servingsPerRecipe}</div>
        </div>
      </div>
    </>
  );
}
