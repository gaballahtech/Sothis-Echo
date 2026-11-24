import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSiteData } from './SiteDataContext';

/**
 * Overlay state for the per-site "case file" full-screen mode and its compare
 * workspace. Kept separate from SiteDataContext (which owns the data) so the
 * case file can be opened/closed and compared without touching the landing
 * page's shared selection.
 *
 * The state is mirrored to the URL query string so a case file / comparison is
 * shareable and survives a refresh:
 *   ?case=<siteId>&compare=<siteId>&layout=side|stacked&section=<facet>
 */
const CaseFileContext = createContext(null);

export const CASE_SECTIONS = [
  { id: 'overview', key: 'casefile.section.overview' },
  { id: 'lenses', key: 'casefile.section.lenses' },
  { id: 'recovery', key: 'casefile.section.recovery' },
  { id: 'timeseries', key: 'casefile.section.timeseries' },
  { id: 'respond', key: 'casefile.section.respond' },
  { id: 'sound', key: 'casefile.section.sound' },
  { id: 'see', key: 'casefile.section.see' },
  { id: 'explain', key: 'casefile.section.explain' },
];

const SECTION_IDS = new Set(CASE_SECTIONS.map((section) => section.id));

function readParams() {
  if (typeof window === 'undefined') return {};
  const query = new URLSearchParams(window.location.search);
  return {
    case: query.get('case'),
    compare: query.get('compare'),
    layout: query.get('layout'),
    section: query.get('section'),
  };
}

export function CaseFileProvider({ children }) {
  const { sites } = useSiteData();
  const initial = useMemo(readParams, []);
  const validSite = (id) => Boolean(id) && sites.some((site) => site.id === id);

  const [openSiteId, setOpenSiteId] = useState(() => (validSite(initial.case) ? initial.case : null));
  const [compareSiteId, setCompareSiteId] = useState(() =>
    validSite(initial.compare) && initial.compare !== initial.case ? initial.compare : null,
  );
  const [layout, setLayout] = useState(initial.layout === 'stacked' ? 'stacked' : 'side');
  const [activeSection, setActiveSection] = useState(() =>
    SECTION_IDS.has(initial.section) ? initial.section : 'overview',
  );

  const open = useCallback((siteId) => {
    setOpenSiteId(siteId);
    setCompareSiteId(null);
    setActiveSection('overview');
  }, []);

  const close = useCallback(() => {
    setOpenSiteId(null);
    setCompareSiteId(null);
  }, []);

  const setCompare = useCallback((siteId) => {
    setCompareSiteId(siteId || null);
  }, []);

  const toggleCompare = useCallback(() => {
    setCompareSiteId((current) => {
      if (current) return null;
      const other = sites.find((site) => site.id !== openSiteId);
      return other?.id ?? null;
    });
  }, [sites, openSiteId]);

  // Mirror state → URL (shareable, refresh-persistent) without adding history entries.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = new URLSearchParams(window.location.search);
    if (openSiteId) query.set('case', openSiteId);
    else query.delete('case');
    if (compareSiteId) {
      query.set('compare', compareSiteId);
      query.set('layout', layout);
    } else {
      query.delete('compare');
      query.delete('layout');
    }
    if (activeSection && activeSection !== 'overview') query.set('section', activeSection);
    else query.delete('section');
    const qs = query.toString();
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', next);
  }, [openSiteId, compareSiteId, layout, activeSection]);

  const value = useMemo(
    () => ({
      sites,
      openSiteId,
      compareSiteId,
      layout,
      activeSection,
      isOpen: Boolean(openSiteId),
      isComparing: Boolean(compareSiteId),
      open,
      close,
      setCompare,
      toggleCompare,
      setLayout,
      setActiveSection,
    }),
    [sites, openSiteId, compareSiteId, layout, activeSection, open, close, setCompare, toggleCompare],
  );

  return <CaseFileContext.Provider value={value}>{children}</CaseFileContext.Provider>;
}

export function useCaseFile() {
  const ctx = useContext(CaseFileContext);
  if (!ctx) throw new Error('useCaseFile must be used inside CaseFileProvider');
  return ctx;
}