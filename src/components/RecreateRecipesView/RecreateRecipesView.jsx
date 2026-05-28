import React, { useMemo } from 'react';
import { C } from '../../constants';
import { GenerateButton, HistoryMealsCounter } from '../ui';
import { RulesEditor } from '../RulesEditor/RulesEditor';
import styles from './RecreateRecipesView.module.css';

export function RecreateRecipesView({
  selectedCount,
  numRecipes,
  onRecreate,
  disabled,
  customRules,
  setCustomRules,
  numPeople,
  calories,
  rulesLoaded
}) {
  const needToFill = numRecipes - selectedCount;
  const buttonLabel = selectedCount === 0
    ? '✨ Cook Without History'
    : needToFill === 0
    ? '✨ Reuse Meals'
    : `✨ Cook ${needToFill} More Meal${needToFill > 1 ? 's' : ''}`;

  const cssVars = useMemo(() => ({
    '--dim-color': C.dim,
    '--muted-color': C.muted
  }), []);

  return (
    <div className={styles.recreatePanel} style={cssVars}>
      <label className={styles.instructionLabel}>
        Select from below to reuse recipes
      </label>

      <HistoryMealsCounter selectedCount={selectedCount} numRecipes={numRecipes} />

      <GenerateButton
        onClick={onRecreate}
        label={buttonLabel}
        disabled={disabled}
      />

      {rulesLoaded && (
        <RulesEditor
          customRules={customRules}
          setCustomRules={setCustomRules}
          numPeople={numPeople}
          calories={calories}
        />
      )}
    </div>
  );
}
