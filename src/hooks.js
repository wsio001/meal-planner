import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';
import { LEGACY_KEY } from './constants';

export function useElapsed(active) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) { setT(0); return; }
    setT(0);
    const id = setInterval(() => setT(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return t;
}

export function usePersistedState(key, def, version) {
  const [value, setValue] = useState(def);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const s = await storage.get(key).catch(() => null);
        if (s) {
          const p = JSON.parse(s.value);
          if (p && p.version === version && p.value !== undefined) {
            if (!cancelled) setValue(p.value);
            return;
          }
        }
      } catch(e) {}
      try {
        const [oldVal, oldVer] = await Promise.all([
          storage.get(LEGACY_KEY).catch(() => null),
          storage.get(LEGACY_KEY + ':v').catch(() => null),
        ]);
        if (oldVal && oldVer && oldVer.value === 'v2') {
          const migrated = JSON.parse(oldVal.value);
          if (!cancelled) {
            setValue(migrated);
            await storage.set(key, JSON.stringify({ version, value: migrated })).catch(() => {});
          }
        }
      } catch(e) {}
    }
    load().finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [key, version]);
  const persist = useCallback(v => {
    setValue(prev => {
      const newValue = typeof v === 'function' ? v(prev) : v;
      storage.set(key, JSON.stringify({ version, value: newValue })).catch(console.error);
      return newValue;
    });
  }, [key, version]);
  return [value, persist, loaded];
}