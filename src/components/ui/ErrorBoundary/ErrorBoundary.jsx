import React from 'react';
import styles from './ErrorBoundary.module.css';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(e) {
    return { err: e.message };
  }

  render() {
    if (this.state.err) {
      return (
        <div className={styles.errorContainer}>
          <p className={styles.errorIcon}>⚠️</p>
          <p>{this.state.err}</p>
          <button onClick={() => location.reload()} className={styles.errorButton}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
