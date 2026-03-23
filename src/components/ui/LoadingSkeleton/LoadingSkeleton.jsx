import React from 'react';
import styles from './LoadingSkeleton.module.css';

export function LoadingSkeleton({ type = 'table' }) {
  if (type === 'table') {
    return (
      <div className={styles.tableSkeletonContainer}>
        {[...Array(5)].map((_, index) => (
          <div key={index} className={styles.tableRow}>
            <div className={styles.skeletonCell} style={{ width: '60%' }} />
            <div className={styles.skeletonCell} style={{ width: '30%' }} />
            <div className={styles.skeletonCell} style={{ width: '10%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={styles.cardSkeletonContainer}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonText} style={{ width: '90%' }} />
        <div className={styles.skeletonText} style={{ width: '75%' }} />
        <div className={styles.skeletonText} style={{ width: '85%' }} />
      </div>
    );
  }

  return (
    <div className={styles.defaultSkeletonContainer}>
      <div className={styles.skeletonText} style={{ width: '100%' }} />
      <div className={styles.skeletonText} style={{ width: '80%' }} />
      <div className={styles.skeletonText} style={{ width: '90%' }} />
    </div>
  );
}
