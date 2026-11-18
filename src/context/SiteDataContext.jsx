import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { studyAreas } from '../data/sites';
import { ensureApiBase, getApiConfig, isApiConfigured, loadStudyAreas } from '../services/sarApi';

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
    await ensureApiBase();
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
    ensureApiBase().then(() => {
      if (cancelled) return;
      if (!isApiConfigured()) {
        setLoading(false);
        return;
      }
      loadStudyAreas().then((result) => {
        if (cancelled) return;
        setSites(result.sites);
        setSource(result.source);
        setError(result.error);
        setLoading(false);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const api = useMemo(() => getApiConfig(), []);

  // Shared "which study area is open" selection, so an atlas click can load the
  // matching story across every panel instead of only scrolling to it.
  const [selectedSiteId, setSelectedSiteId] = useState(() => studyAreas[0]?.id);
  useEffect(() => {
    if (sites.length && !sites.some((item) => item.id === selectedSiteId)) {
      setSelectedSiteId(studyAreas[0]?.id);
    }
  }, [sites, selectedSiteId]);

  return (
    <SiteDataContext.Provider
      value={{ sites, source, error, loading, refresh: load, api, selectedSiteId, setSelectedSiteId }}
    >
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('useSiteData must be used inside SiteDataProvider');
  return ctx;
}
