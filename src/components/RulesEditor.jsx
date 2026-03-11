import React, { useState } from 'react';
import { C, S, DEFAULT_RULES } from '../constants';

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
  return (
    <div style={{ marginTop:16 }}>
      <button onClick={()=>setOpen(v=>!v)} style={{ background:'transparent', border:'none', color:C.dimmer, fontSize:12, cursor:'pointer', padding:0, textDecoration:'underline' }}>
        {open?'▲ Hide recipe rules':'▼ View / edit recipe rules'}
        {isCustom && <span style={{ marginLeft:8, background:C.accentBg, color:C.accentText, borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>CUSTOM</span>}
        <span style={{ marginLeft:8, background:C.successBg, color:C.success, borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>💾 SAVED</span>
      </button>
      {open && (
        <div style={{ marginTop:12, background:C.bg, borderRadius:12, border:'1px solid '+C.border }}>
          <div style={{ borderBottom:'1px solid '+C.card, padding:'8px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, color:C.dim, fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>Auto-generated</span>
              <span style={{ fontSize:10, color:C.dimmer, background:C.card, borderRadius:6, padding:'2px 8px' }}>🔒 locked</span>
            </div>
            {['~'+calories+' cal/serving', numPeople+' servings'].map((r,i)=>(
              <div key={i} style={S.dotRule}><span style={{ color:C.success, fontSize:12 }}>·</span><span style={{ color:C.dimmer, fontSize:12 }}>{r}</span></div>
            ))}
          </div>
          <div style={{ padding:'8px 14px 12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:11, color:C.dim, fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>Editable rules</span>
              {!editing ? (
                <div style={{ display:'flex', gap:8 }}>
                  {isCustom && <button onClick={resetRules} style={{ background:'transparent', border:'1px solid '+C.border, borderRadius:6, color:C.dim, padding:'3px 10px', fontSize:11, cursor:'pointer' }}>Reset</button>}
                  <button onClick={startEdit} style={{ background:C.card, border:'1px solid '+C.accent, borderRadius:6, color:C.accentText, padding:'3px 10px', fontSize:11, cursor:'pointer', fontWeight:600 }}>✏️ Edit</button>
                </div>
              ) : (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={cancelEdit} style={{ background:'transparent', border:'1px solid '+C.border, borderRadius:6, color:C.dim, padding:'3px 10px', fontSize:11, cursor:'pointer' }}>Cancel</button>
                  <button onClick={saveEdit} style={{ background:'#059669', border:'none', borderRadius:6, color:'#fff', padding:'3px 10px', fontSize:11, cursor:'pointer', fontWeight:600 }}>💾 Save</button>
                </div>
              )}
            </div>
            {!editing && customRules.map((r,i)=>(
              <div key={i} style={S.dotRule}><span style={{ color:C.purple, fontSize:12 }}>·</span><span style={{ color:C.muted, fontSize:12 }}>{r}</span></div>
            ))}
            {editing && (
              <div>
                {draft.map((rule,i)=>(
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                    <span style={{ color:C.purple, fontSize:14, flexShrink:0 }}>·</span>
                    <input value={rule} onChange={e=>updateItem(i,e.target.value)} style={{ flex:1, background:C.card, border:'1px solid '+C.border, borderRadius:6, color:C.text, padding:'6px 10px', fontSize:12, outline:'none' }} />
                    <button onClick={()=>removeItem(i)} style={{ background:'transparent', border:'none', color:C.danger, fontSize:16, cursor:'pointer' }}>×</button>
                  </div>
                ))}
                <button onClick={()=>setDraft(d=>[...d,''])} style={{ marginTop:4, background:'transparent', border:'1px dashed '+C.border, borderRadius:6, color:C.dim, padding:'5px 14px', fontSize:12, cursor:'pointer', width:'100%' }}>+ Add rule</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});