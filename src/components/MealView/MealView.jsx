import React, { useState, useMemo, useRef, useEffect } from 'react';
import { C } from '../../constants';
import { SectionHeader } from '../ui/ui';
import { RecipeCard } from '../RecipeCard/RecipeCard';
import styles from './MealView.module.css';

export const MealView = React.memo(function MealView({ mealData, onBack, backLabel }) {
  const [tab, setTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const wR = useMemo(() => mealData.recipes.filter(r => !r.isBatchCook), [mealData.recipes]);
  const bR = useMemo(() => mealData.recipes.filter(r =>  r.isBatchCook), [mealData.recipes]);

  async function copyNotes() {
    const text = Object.entries(mealData.iphoneNotes||{}).filter(([,v])=>v.length).map(([,v])=>v.join('\n')).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch(e) { console.error('Clipboard write failed:', e); }
  }

  const cssVars = {
    '--tab-color': C.dim,
    '--purple-color': C.purple,
    '--text-color': C.text,
    '--muted-color': C.muted,
    '--teal-text': C.tealText,
    '--copy-bg': copied?C.successBg:C.card,
    '--copy-color': copied?C.success:C.purple,
    '--copy-border': copied?C.success:C.purple,
    '--bg-color': C.bg
  };

  return (
    <div>
      {onBack && <button onClick={onBack} className={styles.backButton}>{'← '+(backLabel||'Back')}</button>}
      <div className={styles.mealCard}>
        <div className={styles.tabBar}>
          {[['overview','📅 Overview'],['grocery','🛒 Grocery'],['recipes','👨‍🍳 Recipes']].map(([id,label]) => (
            <button key={id} onClick={()=>setTab(id)} className={`${styles.tabButton} ${tab===id?styles.active:''}`} style={cssVars}>{label}</button>
          ))}
        </div>
        <div className={styles.tabContent}>
          {tab==='overview' && (
            <div>
              {wR.length>0 && (
                <div className={`${styles.overviewSection} ${bR.length>0?'':styles.noMargin}`}>
                  <p className={`${styles.overviewSectionTitle} ${styles.weekly}`}>🍽️ Weekly Dinners</p>
                  <div className={styles.overviewStack}>
                    {wR.map((r,i) => (
                      <div key={r.id||r.name+'_'+i} className={styles.overviewCard} style={cssVars}>
                        <div>
                          <span className={styles.recipeNumber}>{'#'+(i+1)}</span>
                          <span className={styles.recipeName}>{r.name}</span>
                        </div>
                        <div className={styles.overviewRight}>
                          {r.caloriesPerServing&&r.caloriesPerServing!=='—'&&<span className={`${styles.tag} ${styles.calories}`}>{'🔥 '+r.caloriesPerServing}</span>}
                          <span className={`${styles.tag} ${styles.weekly}`}>{r.cuisine}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {bR.length>0 && (
                <div className={styles.overviewSection}>
                  <p className={`${styles.overviewSectionTitle} ${styles.batch}`}>🍲 Batch Cook</p>
                  <div className={styles.overviewStack}>
                    {bR.map((r,i) => (
                      <div key={r.id||r.name+'_b_'+i} className={`${styles.overviewCard} ${styles.batch}`} style={cssVars}>
                        <div>
                          <span className={`${styles.recipeNumber} ${styles.batch}`}>{'Batch #'+(i+1)}</span>
                          <span className={styles.recipeName}>{r.name}</span>
                        </div>
                        <div className={styles.overviewRight}>
                          {r.caloriesPerServing&&r.caloriesPerServing!=='—'&&<span className={`${styles.tag} ${styles.calories}`}>{'🔥 '+r.caloriesPerServing}</span>}
                          <span className={`${styles.tag} ${styles.batch}`}>{r.cuisine}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab==='grocery' && (
            <div>
              <div className={styles.groceryHeader}>
                <h2 className={styles.groceryTitle}>Combined Grocery List</h2>
                <button onClick={copyNotes} className={styles.copyButton} style={cssVars}>{copied?'✓ Copied!':'📋 Copy for Notes'}</button>
              </div>
              {bR.length>0 && <div className={styles.groceryNote}>🍲 Batch cook ingredients are included in this list.</div>}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead><tr className={styles.tableHeader}>{['Type','Item','Quantity','Recipe'].map(h=><th key={h} className={styles.tableHeaderCell}>{h}</th>)}</tr></thead>
                  <tbody>
                    {mealData.grocery.map((row,i) => (
                      <tr key={i} className={styles.tableRow} style={cssVars}>
                        <td className={styles.cellType}>{row[0]}</td>
                        <td className={styles.cellText}>{row[1]}</td>
                        <td className={styles.cellMuted}>{row[2]}</td>
                        <td className={styles.cellDim}>{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab==='recipes' && (
            <div className={styles.recipesContainer}>
              {wR.length>0 && <div><SectionHeader color={C.purple} label="🍽️ Weekly Dinners" /><div className={styles.recipeStack}>{wR.map(r=><RecipeCard key={r.id} r={r} />)}</div></div>}
              {bR.length>0 && <div><SectionHeader color={C.teal}   label="🍲 Batch Cook"    /><div className={styles.recipeStack}>{bR.map(r=><RecipeCard key={r.id} r={r} />)}</div></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
