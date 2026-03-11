import React, { useState } from 'react';
import { C } from '../../constants';
import styles from './ui.module.css';

export const PickerRow = React.memo(function PickerRow({ label, value, setValue, options, ac, bg, tc }) {
  const acC=ac||C.accent, bgC=bg||C.accentBg, tcC=tc||C.accentText;
  const cssVars = {
    '--muted-color': C.muted
  };
  return (
    <div className={styles.pickerContainer} style={cssVars}>
      <label className={styles.pickerLabel}>{label}</label>
      <div className={styles.pickerOptions}>
        {options.map(n => {
          const buttonStyle = {
            '--button-border': value===n?acC:C.border,
            '--button-bg': value===n?bgC:C.bg,
            '--button-color': value===n?tcC:C.dim,
            '--button-weight': value===n?700:400
          };
          return <button key={n} onClick={() => setValue(n)} className={styles.pickerButton} style={buttonStyle}>{n}</button>;
        })}
      </div>
    </div>
  );
});

export const CalorieInput = React.memo(function CalorieInput({ calories, setCalories }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(String(calories));
  function commit() {
    const v=parseInt(temp);
    if(!isNaN(v)&&v>=300&&v<=1500) setCalories(v); else setTemp(String(calories));
    setEditing(false);
  }

  const cssVars = {
    '--muted-color': C.muted,
    '--bg-color': C.bg,
    '--dimmer-color': C.dimmer,
    '--text-color': C.text,
    '--border-color': C.border
  };

  return (
    <div className={styles.calorieContainer} style={cssVars}>
      <label className={styles.calorieLabel}>🔥 Calories / serving</label>
      <div className={styles.calorieInputRow}>
        {editing
          ? <input autoFocus type="number" value={temp} min={300} max={1500} onChange={e=>setTemp(e.target.value)} onBlur={commit} onKeyDown={e=>e.key==='Enter'&&commit()} className={styles.calorieInput} />
          : <button onClick={() => { setTemp(String(calories)); setEditing(true); }} className={styles.calorieButton}>{calories}</button>}
        <span className={styles.calorieUnit}>kcal</span>
      </div>
      <div className={styles.caloriePresets}>
        {[400,500,600,700,750,800].map(n => {
          const presetStyle = {
            '--preset-border': calories===n?C.accent:C.border,
            '--preset-bg': calories===n?C.accentBg:C.bg,
            '--preset-color': calories===n?C.accentText:C.dim
          };
          return <button key={n} onClick={() => { setCalories(n); setTemp(String(n)); setEditing(false); }} className={styles.caloriePreset} style={presetStyle}>{n}</button>;
        })}
      </div>
    </div>
  );
});

export const SpecialRequestInput = React.memo(function SpecialRequestInput({ onSubmit, buttonLabel, disabled }) {
  const [val, setVal] = useState('');

  const cssVars = {
    '--muted-color': C.muted,
    '--dimmer-color': C.dimmer,
    '--bg-color': C.bg,
    '--text-color': C.text,
    '--border-color': C.border
  };

  return (
    <div style={cssVars}>
      <label className={styles.specialRequestLabel}>Special requests <span className={styles.specialRequestOptional}>(optional)</span></label>
      <textarea value={val} onChange={e=>setVal(e.target.value)} placeholder='e.g. "one meal should be 3-cup chicken", "no beef"' className={styles.specialRequestTextarea} />
      <button onClick={() => onSubmit(val)} disabled={disabled} className={styles.specialRequestButton}>
        {buttonLabel}
      </button>
    </div>
  );
});

export const SectionHeader = React.memo(function SectionHeader({ color, label }) {
  const cssVars = {
    '--section-border': color + '44',
    '--section-color': color
  };
  return (
    <div className={styles.sectionHeader} style={cssVars}>
      <span className={styles.sectionHeaderLabel}>{label}</span>
    </div>
  );
});

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state={err:null}; }
  static getDerivedStateFromError(e) { return {err:e.message}; }
  render() {
    if (this.state.err) return (
      <div className={styles.errorContainer}>
        <p className={styles.errorIcon}>⚠️</p><p>{this.state.err}</p>
        <button onClick={()=>location.reload()} className={styles.errorButton}>Reload</button>
      </div>
    );
    return this.props.children;
  }
}
