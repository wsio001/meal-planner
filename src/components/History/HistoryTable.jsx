import React, { useState, useMemo } from 'react';
import { C, S } from '../../constants';
import { HistoryRow } from './HistoryRow';
import styles from './History.module.css';

export const HistoryTable = React.memo(function HistoryTable({
  rows,
  selected,
  onToggle,
  maxSelect,
  acColor,
  acBg,
  acText,
  checkDark,
  disabled
}) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const sorted = useMemo(() => {
    return rows.slice().sort((a, b) => {
      const av = String(a[sortKey] || '').toLowerCase();
      const bv = String(b[sortKey] || '').toLowerCase();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [rows, sortKey, sortDir]);

  const selectedNames = useMemo(() => {
    return new Set(selected.map(r => r.name));
  }, [selected]);

  function toggleSort(k) {
    if (sortKey === k) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDir('asc');
    }
  }

  return (
    <div style={acColor === C.teal ? S.histWrapT : S.histWrap}>
      <table style={S.histTable}>
        <thead>
          <tr style={S.histHdBg}>
            <th style={{ width: 36, padding: 12 }} />
            {[
              ['name', 'Recipe Name'],
              ['cuisine', 'Cuisine'],
              ['caloriesPerServing', 'Cal/Serving']
            ].map(([k, l]) => (
              <th key={k} onClick={() => toggleSort(k)} style={S.thSort}>
                {l}
                <span style={{
                  marginLeft: 4,
                  color: sortKey === k ? (acColor || C.purple) : C.dimmer
                }}>
                  {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((recipe, i) => {
            const isSel = selectedNames.has(recipe.name);
            const isDis = disabled || (!isSel && selected.length >= maxSelect);
            return (
              <HistoryRow
                key={recipe.id || recipe.name + '_' + i}
                recipe={recipe}
                selected={isSel}
                disabled={isDis}
                onToggle={onToggle}
                acColor={acColor}
                acBg={acBg}
                acText={acText}
                checkDark={checkDark}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
