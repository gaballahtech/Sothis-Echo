import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { studyAreas } from '../data/sites';
import { getApiConfig, isApiConfigured, loadStudyAreas } from '../services/sarApi';

/**
 * Single source of truth for study-area data. Starts with the bundled
 * illustrative dataset so the page never blocks or flashes empty, then upgrades
 * to the backend if `VITE_API_BASE_URL` is configured and reachable.
 */
const SiteDataContext = createContext(null);

export function SiteDataProvider({ children }) {
  const [sites, setSites] = useState(studyAreas);
  const [source, setSource] = useState('local');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(() => isApiConfigured());

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      setSites(studyAreas);
      setSource('local');
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await loadStudyAreas();
    setSites(result.sites);
    setSource(result.source);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!isApiConfigured()) {
      setLoading(false);
      return undefined;
    }
    loadStudyAreas().then((result) => {
      if (cancelled) return;
      setSites(result.sites);
      setSource(result.source);
      setError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const api = useMemo(() => getApiConfig(), []);

  return (
    <SiteDataContext.Provider value={{ sites, source, error, loading, refresh: load, api }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('useSiteData must be used inside SiteDataProvider');
  return ctx;
}
