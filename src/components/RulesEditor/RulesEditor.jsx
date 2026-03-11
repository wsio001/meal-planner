import React, { useState } from 'react';
import { C, DEFAULT_RULES } from '../../constants';
import styles from './RulesEditor.module.css';

export const RulesEditor = React.memo(function RulesEditor({ customRules, setCustomRules, numPeople, calories }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const isCustom = customRules.length!==DEFAULT_RULES.length || customRules.some((r,i)=>r!==DEFAULT_RULES[i]);

  function startEdit()  { setDraft([...customRules]); setEditing(true); }
  function cancelEdit() { setEditing(false); setDraft([]); }
  function saveEdit()   { setCustomRules(draft.filter(r=>r.trim())); setEditing(false); }
  function resetRules() { setCustomRules(DEFAULT_RULES); setEditing(false); setDraft([]); }
  function updateItem(i,v) { setDraft(d=>d.map((x,j)=>j===i?v:x)); }
  function removeItem(i)   { setDraft(d=>d.filter((_,j)=>j!==i)); }

  const cssVars = {
    '--dimmer-color': C.dimmer,
    '--accent-bg': C.accentBg,
    '--accent-text': C.accentText,
    '--accent-color': C.accent,
    '--success-bg': C.successBg,
    '--success-color': C.success,
    '--bg-color': C.bg,
    '--border-color': C.border,
    '--card-color': C.card,
    '--dim-color': C.dim,
    '--muted-color': C.muted,
    '--purple-color': C.purple,
    '--text-color': C.text,
    '--danger-color': C.danger
  };

  return (
    <div className={styles.container} style={cssVars}>
      <button onClick={()=>setOpen(v=>!v)} className={styles.toggleButton}>
        {open?'▲ Hide recipe rules':'▼ View / edit recipe rules'}
        {isCustom && <span className={styles.customBadge}>CUSTOM</span>}
        <span className={styles.savedBadge}>💾 SAVED</span>
      </button>
      {open && (
        <div className={styles.rulesPanel}>
          <div className={styles.autoSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Auto-generated</span>
              <span className={styles.lockedBadge}>🔒 locked</span>
            </div>
            {['~'+calories+' cal/serving', numPeople+' servings'].map((r,i)=>(
              <div key={i} className={styles.ruleRow}>
                <span className={`${styles.ruleDot} ${styles.success}`}>·</span>
                <span className={`${styles.ruleText} ${styles.dimmer}`}>{r}</span>
              </div>
            ))}
          </div>
          <div className={styles.editableSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Editable rules</span>
              {!editing ? (
                <div className={styles.buttonGroup}>
                  {isCustom && <button onClick={resetRules} className={styles.resetButton}>Reset</button>}
                  <button onClick={startEdit} className={styles.editButton}>✏️ Edit</button>
                </div>
              ) : (
                <div className={styles.buttonGroup}>
                  <button onClick={cancelEdit} className={styles.cancelButton}>Cancel</button>
                  <button onClick={saveEdit} className={styles.saveButton}>💾 Save</button>
                </div>
              )}
            </div>
            {!editing && customRules.map((r,i)=>(
              <div key={i} className={styles.ruleRow}>
                <span className={`${styles.ruleDot} ${styles.purple}`}>·</span>
                <span className={`${styles.ruleText} ${styles.muted}`}>{r}</span>
              </div>
            ))}
            {editing && (
              <div>
                {draft.map((rule,i)=>(
                  <div key={i} className={styles.editRow}>
                    <span className={styles.editDot}>·</span>
                    <input value={rule} onChange={e=>updateItem(i,e.target.value)} className={styles.editInput} />
                    <button onClick={()=>removeItem(i)} className={styles.removeButton}>×</button>
                  </div>
                ))}
                <button onClick={()=>setDraft(d=>[...d,''])} className={styles.addButton}>+ Add rule</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
