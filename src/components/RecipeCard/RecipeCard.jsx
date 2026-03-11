import React from 'react';
import { C } from '../../constants';
import styles from './RecipeCard.module.css';

export const RecipeCard = React.memo(function RecipeCard({ r }) {
  const b = r.isBatchCook;

  const cssVars = {
    '--label-color': b ? C.tealText : C.accentText,
    '--teal-dark': C.tealDark,
    '--teal-color': C.teal,
    '--text-color': C.text,
    '--cuisine-color': b ? C.tealText : C.accentText,
    '--dim-color': C.dim,
    '--success-color': C.success
  };

  return (
    <div className={`${styles.recipeCard} ${b ? styles.batch : styles.weekly}`} style={cssVars}>
      <div className={`${styles.recipeHeader} ${b ? styles.batch : styles.weekly}`}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.headerMeta}>
              <span className={styles.recipeLabel}>Recipe {r.number}</span>
              {b && <span className={styles.batchBadge}>🍲 BATCH</span>}
            </div>
            <h3 className={styles.recipeName}>{r.name}</h3>
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.cuisineText}>{r.cuisine}</div>
            <div className={styles.cookTime}>⏱ {r.cookTime}</div>
            {r.caloriesPerServing&&r.caloriesPerServing!=='—'&&<div className={styles.calories}>🔥 {r.caloriesPerServing} cal/serving</div>}
          </div>
        </div>
      </div>
      <div className={styles.recipeGrid}>
        <div>
          <h4 className={`${styles.ingredientsTitle} ${b ? styles.batch : styles.weekly}`}>Ingredients</h4>
          <ul className={styles.ingredientsList}>
            {r.ingredients.map((x,i) => (
              <li key={i} className={styles.ingredientItem}>
                <span className={`${styles.ingredientDot} ${b ? styles.batch : styles.weekly}`}>·</span>
                {typeof x === 'object' && x.text ? x.text : x}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className={styles.workflowTitle}>Workflow</h4>
          <ul className={styles.workflowList}>
            {r.workflow.map((x,i) => <li key={i} className={styles.workflowItem}>{x}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
});
