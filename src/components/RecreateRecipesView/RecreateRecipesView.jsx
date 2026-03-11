import React from 'react';
import { C } from '../../constants';
import { GenerateButton, HistoryMealsCounter } from '../ui';
import { RulesEditor } from '../RulesEditor/RulesEditor';
import styles from './RecreateRecipesView.module.css';

export function RecreateRecipesView({
  selectedCount,
  numDinners,
  onRecreate,
  disabled,
  customRules,
  setCustomRules,
  numPeople,
  calories,
  rulesLoaded
}) {
  const needToFill = numDinners - selectedCount;
  const buttonLabel = selectedCount === 0
    ? '✨ Cook Without History'
    : needToFill === 0
    ? '✨ Recreate Meals'
    : `✨ Fill ${needToFill} meal${needToFill > 1 ? 's' : ''} with AI`;

  const cssVars = {
    '--dim-color': C.dim,
    '--muted-color': C.muted
  };

  return (
    <div className={styles.recreatePanel} style={cssVars}>
      <label className={styles.instructionLabel}>
        Select from below to reuse recipes
      </label>

      <HistoryMealsCounter selectedCount={selectedCount} numDinners={numDinners} />

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
