import React, { useState } from 'react';
import { C } from '../../constants';
import styles from './History.module.css';

export const HistoryRow = React.memo(function HistoryRow({
  recipe,
  selected,
  disabled,
  onToggle,
  acColor,
  acBg,
  acText,
  checkDark
}) {
  const [hovered, setHovered] = useState(false);

  const rowClasses = [
    styles.historyRow,
    selected && styles.selected,
    hovered && styles.hovered,
    disabled && styles.disabled
  ].filter(Boolean).join(' ');

  const rowStyle = {
    '--row-bg-selected': acBg || C.accentBg,
    '--checkbox-border': selected ? (acColor || C.accent) : C.dimmer,
    '--checkbox-bg': selected ? (acColor || C.accent) : 'transparent',
    '--checkmark-color': checkDark ? C.tealDark : '#fff',
    '--text-color': C.text,
    '--badge-bg': acBg || C.accentBg,
    '--badge-text': acText || C.accentText,
    '--success-color': C.success,
    '--dimmer-color': C.dimmer,
    borderBottom: '1px solid ' + C.bg
  };

  return (
    <tr
      onClick={() => !disabled && onToggle(recipe)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={rowClasses}
      style={rowStyle}
    >
      <td className={styles.checkboxCell}>
        <div className={styles.checkbox}>
          {selected && <span className={styles.checkmark}>✓</span>}
        </div>
      </td>
      <td className={styles.nameCell}>{recipe.name}</td>
      <td className={styles.cuisineCell}>
        <span className={styles.cuisineBadge}>{recipe.cuisine}</span>
      </td>
      <td className={styles.caloriesCell}>
        {recipe.caloriesPerServing && recipe.caloriesPerServing !== '—'
          ? '🔥 ' + recipe.caloriesPerServing
          : <span className={styles.caloriesEmpty}>—</span>
        }
      </td>
    </tr>
  );
});
