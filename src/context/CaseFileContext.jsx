import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useSiteData } from './SiteDataContext';

/**
 * Overlay state for the per-site "case file" full-screen mode and its compare
 * workspace. Kept separate from SiteDataContext (which owns the data) so the
 * case file can be opened/closed and compared without touching the landing
 * page's shared selection.
 *
 * - openSiteId: the site whose case file is open (null = closed)
 * - compareSiteId: an optional second site pinned for side-by-side comparison
 * - layout: 'side' (side-by-side) | 'stacked' (top/bottom)
 * - activeSection: which facet is shown (synced across both panes in compare)
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

export function CaseFileProvider({ children }) {
  const { sites } = useSiteData();
  const [openSiteId, setOpenSiteId] = useState(null);
  const [compareSiteId, setCompareSiteId] = useState(null);
  const [layout, setLayout] = useState('side');
  const [activeSection, setActiveSection] = useState('overview');

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