import React, { useState, useEffect } from 'react';
import {
  isAuthenticated,
  initiateOAuth,
  clearTokens,
  getUserProfile,
  getUserDefaultStore
} from '../../kroger';
import { C } from '../../constants';
import styles from './KrogerAuth.module.css';

export function KrogerAuth({ onSuccess, onCancel }) {
  const [authStatus, setAuthStatus] = useState('checking'); // 'checking' | 'authenticated' | 'unauthenticated'
  const [userInfo, setUserInfo] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // If already authenticated when component mounts, notify parent
    if (authStatus === 'authenticated' && onSuccess) {
      onSuccess();
    }
  }, [authStatus, onSuccess]);

  async function checkAuthStatus() {
    setAuthStatus('checking');
    setError(null);

    if (isAuthenticated()) {
      setAuthStatus('authenticated');

      // Fetch user profile and store info
      try {
        const profile = await getUserProfile();
        setUserInfo(profile.data);

        const store = await getUserDefaultStore();
        setStoreInfo(store);
      } catch (err) {
        console.error('Failed to fetch user info:', err);
        setError('Failed to load profile. Please try reconnecting.');
      }
    } else {
      setAuthStatus('unauthenticated');
    }
  }

  function handleConnect() {
    try {
      initiateOAuth();
    } catch (err) {
      setError('Failed to initiate OAuth. Check your credentials in .env');
      console.error(err);
    }
  }

  function handleDisconnect() {
    clearTokens();
    setAuthStatus('unauthenticated');
    setUserInfo(null);
    setStoreInfo(null);
  }

  if (authStatus === 'checking') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.spinner}></div>
          <p className={styles.checkingText}>Checking Kroger connection...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>🏪</div>
          <h2 className={styles.title}>Connect your Ralph's account</h2>
          <p className={styles.description}>
            Sign in once — stays connected so you never have to log in again.
            Your password goes directly to Kroger's login page — this app never sees it.
          </p>

          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            className={styles.connectButton}
            style={{ background: C.accent }}
          >
            Sign in with Ralph's
          </button>

          {onCancel && (
            <button onClick={onCancel} className={styles.cancelLink}>
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Authenticated
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.connectedIcon}>✓</div>
        <h2 className={styles.title}>Connected to Kroger</h2>

        {userInfo && (
          <div className={styles.userInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Account:</span>
              <span className={styles.value}>{userInfo.firstName || 'User'}</span>
            </div>
          </div>
        )}

        {storeInfo && (
          <div className={styles.storeInfo}>
            <div className={styles.storeHeader}>Your Default Store</div>
            <div className={styles.storeName}>{storeInfo.name}</div>
            <div className={styles.storeAddress}>
              {storeInfo.address?.addressLine1}<br />
              {storeInfo.address?.city}, {storeInfo.address?.state} {storeInfo.address?.zipCode}
            </div>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <button
          onClick={handleDisconnect}
          className={styles.disconnectButton}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
