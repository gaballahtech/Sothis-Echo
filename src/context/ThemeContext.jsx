import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Day / night mode. The saved choice wins; otherwise the operating system's
 * preference decides, so a visitor who already runs a dark desktop is not
 * greeted with a white page.
 */
const STORAGE_KEY = 'sothis-echo-theme';
const ThemeContext = createContext(null);

function readStored() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'dark' || saved === 'light' ? saved : null;
  } catch {
    return null;
  }
}

export function initialTheme() {
  const stored = readStored();
  if (stored) return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    // Blueprint reads its palette from a theme class on a container, and its
    // portals mount on <body> — so both the shell and body carry it.
    document.body.classList.toggle('bp6-dark', theme === 'dark');
    document.body.classList.toggle('bp6-light', theme !== 'dark');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#151513' : '#f7f6f2');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage is optional */
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((current) => (current === 'dark' ? 'light' : 'dark')), []);

  const value = useMemo(() => ({ theme, isDark: theme === 'dark', toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
