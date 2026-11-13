import { createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * Two audiences, one dataset:
 *  - public:      plain language, analogies, no jargon walls
 *  - researcher:  adds acquisition notes, dB tables, methods, limits, sources
 *
 * The mode is global so every section can adapt without prop drilling.
 */
const ModeContext = createContext(null);

const STORAGE_KEY = 'dancing-with-sar-mode';

export function ModeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    if (typeof window === 'undefined') return 'public';
    try {
      return localStorage.getItem(STORAGE_KEY) === 'researcher' ? 'researcher' : 'public';
    } catch {
      return 'public';
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* mode still works for this session */
    }
  }, [mode]);

  const setMode = useCallback((next) => {
    setModeState(next === 'researcher' ? 'researcher' : 'public');
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => (current === 'public' ? 'researcher' : 'public'));
  }, []);

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode, isResearcher: mode === 'researcher' }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used inside ModeProvider');
  return ctx;
}
