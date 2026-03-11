import React from 'react';
import { C, S } from '../constants';

export const RecipeCard = React.memo(function RecipeCard({ r }) {
  const b = r.isBatchCook;
  return (
    <div style={b ? S.rcWrapB : S.rcWrapW}>
      <div style={b ? S.rcHdrB : S.rcHdrW}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:11, color:b?C.tealText:C.accentText, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>Recipe {r.number}</span>
              {b && <span style={{ background:C.tealDark, color:C.teal, border:'1px solid '+C.teal, borderRadius:10, padding:'1px 8px', fontSize:10, fontWeight:700 }}>🍲 BATCH</span>}
            </div>
            <h3 style={{ margin:0, color:C.text, fontSize:18 }}>{r.name}</h3>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:b?C.tealText:C.accentText, fontSize:12 }}>{r.cuisine}</div>
            <div style={{ color:C.dim, fontSize:12 }}>⏱ {r.cookTime}</div>
            {r.caloriesPerServing&&r.caloriesPerServing!=='—'&&<div style={{ color:C.success, fontSize:12 }}>🔥 {r.caloriesPerServing} cal/serving</div>}
          </div>
        </div>
      </div>
      <div style={S.rcGrid}>
        <div>
          <h4 style={b?S.rcIngH4B:S.rcIngH4W}>Ingredients</h4>
          <ul style={{ margin:0, padding:0, listStyle:'none' }}>
            {r.ingredients.map((x,i) => <li key={i} style={S.rcIngItem}><span style={b?S.rcIngDotB:S.rcIngDotW}>·</span>{x}</li>)}
          </ul>
        </div>
        <div>
          <h4 style={S.rcWfH4}>Workflow</h4>
          <ul style={{ margin:0, padding:0, listStyle:'none' }}>
            {r.workflow.map((x,i) => <li key={i} style={S.rcWfItem}>{x}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
});