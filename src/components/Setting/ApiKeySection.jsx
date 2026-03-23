import React, { useState, useEffect, useMemo } from 'react';
import { C } from '../../constants';
import styles from './Setting.module.css';

export function ApiKeySection({ apiKey, onApiKeyChange }) {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [validation, setValidation] = useState({
    status: 'idle', // 'idle' | 'checking' | 'valid' | 'invalid'
    message: ''
  });

  // Sync local state when prop changes
  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  // Notify parent of changes
  useEffect(() => {
    if (localApiKey !== apiKey) {
      onApiKeyChange(localApiKey, validation.status);
    }
  }, [localApiKey, validation.status, apiKey, onApiKeyChange]);

  // Validate API key with debounce
  useEffect(() => {
    if (!localApiKey || !localApiKey.trim()) {
      setValidation({ status: 'idle', message: '' });
      return;
    }

    setValidation({ status: 'checking', message: '' });

    const timer = setTimeout(() => {
      if (!localApiKey.startsWith('sk-ant-')) {
        setValidation({
          status: 'invalid',
          message: 'Please enter a valid API key'
        });
      } else if (localApiKey.length < 40) {
        setValidation({
          status: 'invalid',
          message: 'API key is too short'
        });
      } else {
        setValidation({ status: 'valid', message: '' });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localApiKey]);

  const cssVars = useMemo(() => ({
    '--valid-color': C.success,
    '--invalid-color': '#fca5a5'
  }), []);

  return (
    <div className={styles.apiKeySection}>
      {/* Security Warning */}
      <div className={styles.securityNotice}>
        <div className={styles.noticeHeader}>
          <span className={styles.noticeIcon}>🔒</span>
          <strong>Security Notice</strong>
        </div>
        <ul className={styles.noticeList}>
          <li>Only enter your API key on <strong>{window.location.hostname}</strong></li>
          <li>Never share your API key with anyone</li>
          <li>Your key is stored locally in your browser only</li>
        </ul>
      </div>

      <label className={styles.apiKeyLabel}>🔑 Anthropic API Key</label>
      <input
        type="password"
        value={localApiKey}
        onChange={(e) => setLocalApiKey(e.target.value)}
        placeholder="sk-ant-..."
        className={styles.apiKeyInput}
      />
      {validation.status === 'checking' && (
        <p className={styles.apiKeyValidating} style={cssVars}>
          ⏳ Checking...
        </p>
      )}
      {validation.status === 'valid' && (
        <p className={styles.apiKeyValid} style={cssVars}>
          ✓ Valid API key
        </p>
      )}
      {validation.status === 'invalid' && (
        <p className={styles.apiKeyInvalid} style={cssVars}>
          ✗ {validation.message}
        </p>
      )}
      {validation.status === 'idle' && (
        <p className={styles.apiKeyHint}>
          Your API key is stored locally and never sent to any server except Anthropic's API.
        </p>
      )}
    </div>
  );
}
