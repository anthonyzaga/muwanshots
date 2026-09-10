import { createContext, useContext, useEffect, useState, useMemo } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'muwanshots-theme'; // 'dark' | 'light' | 'system'

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolveTheme(stored) {
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemTheme();
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system';
    } catch {
      return 'system';
    }
  });
  const [resolved, setResolved] = useState(() => resolveTheme(preference));

  // listen to system changes when preference is system
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      if (preference === 'system') setResolved(getSystemTheme());
    };
    // Safari compat
    if (mql.addEventListener) mql.addEventListener('change', handler);
    else mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler);
      else mql.removeListener(handler);
    };
  }, [preference]);

  useEffect(() => {
    const next = resolveTheme(preference);
    setResolved(next);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch (_e) { /* storage unavailable */ }
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(next);
    root.setAttribute('data-theme', next);
    root.style.colorScheme = next;
  }, [preference, resolved]);

  // initial sync in case hydration mismatch
  useEffect(() => {
    setResolved(resolveTheme(preference));
  }, []); // eslint-disable-line

  const value = useMemo(() => ({
    preference,
    resolved,
    setPreference,
    cycle: () => setPreference(p => p === 'light' ? 'dark' : p === 'dark' ? 'system' : 'light'),
  }), [preference, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
