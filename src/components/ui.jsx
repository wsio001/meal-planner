import React, { useState } from 'react';
import { C, S } from '../constants';

export const PickerRow = React.memo(function PickerRow({ label, value, setValue, options, ac, bg, tc }) {
  const acC=ac||C.accent, bgC=bg||C.accentBg, tcC=tc||C.accentText;
  return (
    <div style={{ flex:1, minWidth:140 }}>
      <label style={{ display:'block', color:C.muted, fontSize:12, marginBottom:8, fontWeight:500 }}>{label}</label>
      <div style={S.flexWrap}>
        {options.map(n => (
          <button key={n} onClick={() => setValue(n)} style={{ width:36, height:36, borderRadius:8, cursor:'pointer', border:'1px solid '+(value===n?acC:C.border), background:value===n?bgC:C.bg, color:value===n?tcC:C.dim, fontWeight:value===n?700:400, fontSize:14 }}>{n}</button>
        ))}
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
  return (
    <div style={{ flex:1, minWidth:140 }}>
      <label style={{ display:'block', color:C.muted, fontSize:12, marginBottom:8, fontWeight:500 }}>🔥 Calories / serving</label>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {editing
          ? <input autoFocus type="number" value={temp} min={300} max={1500} onChange={e=>setTemp(e.target.value)} onBlur={commit} onKeyDown={e=>e.key==='Enter'&&commit()} style={{ width:90, height:36, background:C.bg, border:'1px solid '+C.dimmer, borderRadius:8, color:C.text, padding:'0 12px', fontSize:14, outline:'none', textAlign:'center' }} />
          : <button onClick={() => { setTemp(String(calories)); setEditing(true); }} style={{ width:90, height:36, background:C.bg, border:'1px solid '+C.dimmer, borderRadius:8, color:C.text, fontSize:14, cursor:'pointer' }}>{calories}</button>}
        <span style={{ color:C.dimmer, fontSize:12 }}>kcal</span>
      </div>
      <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
        {[400,500,600,700,750,800].map(n => (
          <button key={n} onClick={() => { setCalories(n); setTemp(String(n)); setEditing(false); }} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid', borderColor:calories===n?C.accent:C.border, background:calories===n?C.accentBg:C.bg, color:calories===n?C.accentText:C.dim, fontSize:12, cursor:'pointer' }}>{n}</button>
        ))}
      </div>
    </div>
  );
});

export const SpecialRequestInput = React.memo(function SpecialRequestInput({ onSubmit, buttonLabel, disabled }) {
  const [val, setVal] = useState('');
  return (
    <div>
      <label style={{ display:'block', color:C.muted, fontSize:13, marginBottom:8, fontWeight:500 }}>Special requests <span style={{ color:C.dimmer }}>(optional)</span></label>
      <textarea value={val} onChange={e=>setVal(e.target.value)} placeholder='e.g. "one meal should be 3-cup chicken", "no beef"' style={{ width:'100%', minHeight:72, background:C.bg, border:'1px solid '+C.dimmer, borderRadius:10, color:C.text, padding:'10px 14px', fontSize:14, resize:'vertical', outline:'none', marginBottom:16, boxSizing:'border-box' }} />
      <button onClick={() => onSubmit(val)} disabled={disabled} style={{ width:'100%', height:44, borderRadius:10, border:'none', background:disabled?C.border:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:15, fontWeight:600, cursor:disabled?'not-allowed':'pointer' }}>
        {buttonLabel}
      </button>
    </div>
  );
});

export const SectionHeader = React.memo(function SectionHeader({ color, label }) {
  return (
    <div style={{ borderBottom:'2px solid '+color+'44', paddingBottom:8, marginBottom:16 }}>
      <span style={{ color, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>{label}</span>
    </div>
  );
});

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state={err:null}; }
  static getDerivedStateFromError(e) { return {err:e.message}; }
  render() {
    if (this.state.err) return (
      <div style={{ padding:40, textAlign:'center', color:'#f87171' }}>
        <p style={{ fontSize:32 }}>⚠️</p><p>{this.state.err}</p>
        <button onClick={()=>location.reload()} style={{ background:'#6366f1', border:'none', borderRadius:8, color:'#fff', padding:'8px 20px', cursor:'pointer', marginTop:12 }}>Reload</button>
      </div>
    );
    return this.props.children;
  }
}