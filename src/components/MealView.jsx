import React, { useState, useMemo, useRef, useEffect } from 'react';
import { C, S } from '../constants';
import { SectionHeader } from './ui';
import { RecipeCard } from './RecipeCard';

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

  return (
    <div>
      {onBack && <button onClick={onBack} style={S.backBtn}>{'← '+(backLabel||'Back')}</button>}
      <div style={S.mealCard}>
        <div style={S.tabBar}>
          {[['overview','📅 Overview'],['grocery','🛒 Grocery'],['recipes','👨‍🍳 Recipes']].map(([id,label]) => (
            <button key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:'14px 8px', border:'none', background:'transparent', color:tab===id?C.purple:C.dim, fontWeight:tab===id?700:400, fontSize:13, cursor:'pointer', borderBottom:tab===id?'2px solid '+C.purple:'2px solid transparent' }}>{label}</button>
          ))}
        </div>
        <div style={S.tabContent}>
          {tab==='overview' && (
            <div>
              {wR.length>0 && (
                <div style={{ marginBottom:bR.length>0?24:0 }}>
                  <p style={S.ovSecW}>🍽️ Weekly Dinners</p>
                  <div style={S.ovStack}>
                    {wR.map((r,i) => (
                      <div key={r.id||r.name+'_'+i} style={S.ovCard}>
                        <div><span style={{ fontWeight:600, color:C.text }}>{'#'+(i+1)}</span><span style={{ color:C.muted, marginLeft:8 }}>{r.name}</span></div>
                        <div style={S.ovRight}>
                          {r.caloriesPerServing&&r.caloriesPerServing!=='—'&&<span style={S.tagCal}>{'🔥 '+r.caloriesPerServing}</span>}
                          <span style={S.tagW}>{r.cuisine}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {bR.length>0 && (
                <div>
                  <p style={S.ovSecB}>🍲 Batch Cook</p>
                  <div style={S.ovStack}>
                    {bR.map((r,i) => (
                      <div key={r.id||r.name+'_b_'+i} style={S.ovCardB}>
                        <div><span style={{ fontWeight:600, color:C.tealText }}>{'Batch #'+(i+1)}</span><span style={{ color:C.muted, marginLeft:8 }}>{r.name}</span></div>
                        <div style={S.ovRight}>
                          {r.caloriesPerServing&&r.caloriesPerServing!=='—'&&<span style={S.tagCal}>{'🔥 '+r.caloriesPerServing}</span>}
                          <span style={S.tagB}>{r.cuisine}</span>
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
              <div style={S.grHdr}>
                <h2 style={{ color:'#e2e8f0', fontSize:16, margin:0 }}>Combined Grocery List</h2>
                <button onClick={copyNotes} style={{ background:copied?C.successBg:C.card, color:copied?C.success:C.purple, border:'1px solid '+(copied?C.success:C.purple), borderRadius:8, padding:'7px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }}>{copied?'✓ Copied!':'📋 Copy for Notes'}</button>
              </div>
              {bR.length>0 && <div style={S.grNote}>🍲 Batch cook ingredients are included in this list.</div>}
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead><tr style={S.tableHdBg}>{['Type','Item','Quantity','Recipe'].map(h=><th key={h} style={S.thBase}>{h}</th>)}</tr></thead>
                  <tbody>
                    {mealData.grocery.map((row,i) => (
                      <tr key={i} style={{ borderBottom:'1px solid '+C.bg }}>
                        <td style={S.cellType}>{row[0]}</td><td style={S.cellText}>{row[1]}</td>
                        <td style={S.cellMuted}>{row[2]}</td><td style={S.cellDim}>{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab==='recipes' && (
            <div style={S.sectStack}>
              {wR.length>0 && <div><SectionHeader color={C.purple} label="🍽️ Weekly Dinners" /><div style={S.rcStack}>{wR.map(r=><RecipeCard key={r.id} r={r} />)}</div></div>}
              {bR.length>0 && <div><SectionHeader color={C.teal}   label="🍲 Batch Cook"    /><div style={S.rcStack}>{bR.map(r=><RecipeCard key={r.id} r={r} />)}</div></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});