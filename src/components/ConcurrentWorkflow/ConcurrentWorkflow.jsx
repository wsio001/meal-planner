import React, { useMemo } from 'react';
import { C } from '../../constants';
import styles from './ConcurrentWorkflow.module.css';

/**
 * ConcurrentWorkflow Component
 *
 * Displays a phase-based concurrent cooking workflow that shows:
 * - PREP PHASE: Consolidated prep tasks across all recipes
 * - COOKING PHASE: Recipes cooking concurrently, grouped by method
 * - Total time estimate
 */
export function ConcurrentWorkflow({ workflowText }) {
  const cssVars = useMemo(() => ({
    '--success-color': C.success,
    '--teal-color': C.teal,
    '--accent-color': C.accent,
    '--purple-color': C.purple,
    '--text-color': C.text,
    '--muted-color': C.muted,
    '--card-bg': C.card,
    '--border-color': C.border
  }), []);

  // Parse the concurrent workflow text
  const parsedWorkflow = useMemo(() => {
    if (!workflowText || typeof workflowText !== 'string') {
      return null;
    }

    // Extract sections
    const prepMatch = workflowText.match(/PREP PHASE[^\n]*\n([\s\S]*?)(?=\n\nCOOKING PHASE|\n\nTOTAL TIME|$)/i);
    const cookingMatch = workflowText.match(/COOKING PHASE[^\n]*\n([\s\S]*?)(?=\n\nTOTAL TIME|$)/i);
    const totalTimeMatch = workflowText.match(/TOTAL TIME:\s*(.+)/i);

    const prepPhase = prepMatch ? prepMatch[1].trim() : '';
    const cookingPhase = cookingMatch ? cookingMatch[1].trim() : '';
    const totalTime = totalTimeMatch ? totalTimeMatch[1].trim() : '';

    // Parse prep phase by categories
    const prepCategories = [];
    if (prepPhase) {
      const categoryRegex = /(EQUIPMENT\s+SETUP|PROTEINS|VEGETABLES|MARINADES?\s*&?\s*SEASONINGS?|PANTRY):\s*\n([\s\S]*?)(?=\n\n[A-Z]+:|$)/gi;
      let match;
      while ((match = categoryRegex.exec(prepPhase)) !== null) {
        const category = match[1].trim();
        const items = match[2]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-'))
          .map(line => line.replace(/^-\s*/, ''))
          .filter(line => line.length > 3);

        if (items.length > 0) {
          prepCategories.push({ category, items });
        }
      }

      // Fallback: if no categories found, treat all items as uncategorized
      if (prepCategories.length === 0) {
        const allItems = prepPhase
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-') || line.startsWith('•'))
          .map(line => line.replace(/^[-•]\s*/, ''))
          .filter(line => line.length > 3);

        if (allItems.length > 0) {
          prepCategories.push({
            category: 'PREP TASKS',
            items: allItems
          });
        }
      }
    }

    // Parse cooking phase by cooking method
    const cookingMethods = [];
    if (cookingPhase) {
      const methodBlocks = cookingPhase.split(/\n\n+/);

      methodBlocks.forEach(block => {
        const lines = block.trim().split('\n');
        if (lines.length === 0) return;

        // First line might be [Method - Recipe Name]
        const headerMatch = lines[0].match(/\[(.+?)\s*-\s*(.+?)\]/);

        if (headerMatch) {
          const method = headerMatch[1].trim();
          const recipeName = headerMatch[2].trim();
          const steps = lines.slice(1)
            .filter(l => l.trim())
            .filter(l => !l.match(/^---+$/)) // Filter out separator lines
            .filter(l => !l.match(/^#+\s/)) // Filter out markdown headers
            .filter(l => l.length > 3); // Filter out very short lines

          // Only add if we have actual steps
          if (steps.length > 0) {
            cookingMethods.push({
              method,
              recipeName,
              steps
            });
          }
        } else {
          // Check if this looks like a real step (not junk)
          const steps = lines
            .filter(l => l.trim())
            .filter(l => !l.match(/^---+$/))
            .filter(l => !l.match(/^#+\s/))
            .filter(l => !l.match(/^\|.*\|$/)) // Filter table rows
            .filter(l => l.length > 3);

          // Skip blocks with no meaningful content
          if (steps.length > 0 && steps.some(s => s.includes(':') || s.includes('-'))) {
            cookingMethods.push({
              method: 'Other',
              recipeName: '',
              steps
            });
          }
        }
      });
    }

    return {
      prepCategories,
      cookingMethods,
      totalTime
    };
  }, [workflowText]);

  if (!parsedWorkflow) {
    return (
      <div className={styles.emptyState} style={cssVars}>
        <div className={styles.emptyIcon}>🍳</div>
        <p className={styles.emptyText}>No concurrent workflow generated yet.</p>
        <p className={styles.emptyHint}>Generate recipes to see the optimized cooking workflow!</p>
      </div>
    );
  }

  const { prepCategories, cookingMethods, totalTime } = parsedWorkflow;

  // Get color for cooking method
  const getMethodColor = (method) => {
    const m = method.toLowerCase();
    if (m.includes('sous vide')) return C.purple;
    if (m.includes('oven')) return '#f59e0b'; // orange
    if (m.includes('stovetop') || m.includes('stove')) return '#ef4444'; // red
    if (m.includes('air fryer') || m.includes('air')) return '#3b82f6'; // blue
    if (m.includes('pressure') || m.includes('instant pot')) return C.teal;
    return C.accent;
  };

  return (
    <div className={styles.workflowContainer} style={cssVars}>
      {/* Header with total time */}
      {totalTime && (
        <div className={styles.totalTimeCard}>
          <div className={styles.totalTimeIcon}>⏱️</div>
          <div>
            <div className={styles.totalTimeLabel}>Total Time</div>
            <div className={styles.totalTimeValue}>{totalTime}</div>
          </div>
        </div>
      )}

      {/* Prep Phase */}
      {prepCategories.length > 0 && (
        <div className={styles.phaseSection}>
          <div className={styles.phaseHeader}>
            <span className={styles.phaseIcon}>🔪</span>
            <h3 className={styles.phaseTitle}>PREP PHASE</h3>
          </div>
          <div className={styles.prepCategoriesGrid}>
            {prepCategories.map((cat, i) => {
              const icon = cat.category.includes('PROTEIN') ? '🥩' :
                           cat.category.includes('VEGETABLE') ? '🥬' :
                           cat.category.includes('MARINADE') || cat.category.includes('SEASON') ? '🧂' :
                           cat.category.includes('PANTRY') ? '🏪' : '📦';
              return (
                <div key={i} className={styles.prepCategory}>
                  <div className={styles.prepCategoryHeader}>
                    <span className={styles.prepCategoryIcon}>{icon}</span>
                    <h4 className={styles.prepCategoryTitle}>{cat.category}</h4>
                  </div>
                  <div className={styles.prepCategoryItems}>
                    {cat.items.map((item, j) => (
                      <div key={j} className={styles.prepCategoryItem}>
                        • {item}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cooking Phase */}
      {cookingMethods.length > 0 && (
        <div className={styles.phaseSection}>
          <div className={styles.phaseHeader}>
            <span className={styles.phaseIcon}>🔥</span>
            <h3 className={styles.phaseTitle}>COOKING PHASE (Concurrent)</h3>
          </div>
          <div className={styles.cookingGrid}>
            {cookingMethods.map((methodBlock, i) => {
              const methodColor = getMethodColor(methodBlock.method);
              return (
                <div
                  key={i}
                  className={styles.methodCard}
                  style={{ '--method-color': methodColor }}
                >
                  <div className={styles.methodHeader}>
                    <div className={styles.methodBadge}>{methodBlock.method}</div>
                    {methodBlock.recipeName && (
                      <div className={styles.recipeName}>{methodBlock.recipeName}</div>
                    )}
                  </div>
                  <div className={styles.methodSteps}>
                    {methodBlock.steps.map((step, j) => (
                      <div key={j} className={styles.stepItem}>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Helper note */}
      <div className={styles.helperNote}>
        <span className={styles.helperIcon}>💡</span>
        <span>This workflow allows you to prep and cook all recipes simultaneously, saving time and kitchen space.</span>
      </div>
    </div>
  );
}
