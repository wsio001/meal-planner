import React from 'react';
import { C } from '../../constants';
import { GenerateButton } from '../ui';
import styles from './RecreateRecipesView.module.css';

export function RecreateRecipesView({
  selectedCount,
  numDinners,
  onRecreate,
  disabled
}) {
  const needToFill = numDinners - selectedCount;
  const buttonLabel = needToFill === 0
    ? '✨ Recreate Meals'
    : `✨ Fill ${needToFill} meal${needToFill > 1 ? 's' : ''} with AI`;

  const cssVars = {
    '--dim-color': C.dim,
    '--muted-color': C.muted
  };

  return (
    <div className={styles.recreatePanel} style={cssVars}>
      <div className={styles.infoSection}>
        <p className={styles.infoText}>
          {selectedCount === 0
            ? 'Select recipes from the Weekly history tab below to recreate your meal plan'
            : selectedCount === numDinners
            ? `You've selected ${selectedCount} recipe${selectedCount > 1 ? 's' : ''}. Ready to recreate your meal plan!`
            : `You've selected ${selectedCount} recipe${selectedCount > 1 ? 's' : ''}. We'll fill the remaining ${needToFill} with AI-generated recipes.`}
        </p>
      </div>
      <GenerateButton
        onClick={onRecreate}
        label={buttonLabel}
        disabled={disabled || selectedCount === 0}
      />
    </div>
  );
}
