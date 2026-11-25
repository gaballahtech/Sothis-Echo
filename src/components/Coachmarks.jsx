import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'sothis-guide:v1';

// Contextual, opt-in tips (pull, not push). Each = one idea, anchored to a real
// element, shown the first time the visitor reaches that section.
const TIPS = [
  { id: 'atlas', section: 'atlas', target: '#atlas .atlas-cards', title: 'guide.atlasTitle', body: 'guide.atlasBody' },
  { id: 'see', section: 'see-through', target: '#see-through .compare-frame', title: 'guide.seeTitle', body: 'guide.seeBody' },
  { id: 'game', section: 'game', target: '#game .app-panel', title: 'guide.gameTitle', body: 'guide.gameBody' },
];

const GuideContext = createContext(null);
export function useGuide() {
  return useContext(GuideContext);
}

function readSeen() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function CoachmarksProvider({ children }) {
  const [seen, setSeen] = useState(readSeen);
  const [active, setActive] = useState(null);

  const dismiss = useCallback((id) => {
    setSeen((prev) => {
      const next = { ...prev, [id]: true };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* optional */ }
      return next;
    });
    setActive(null);
  }, []);

  const replay = useCallback(() => {
    setSeen({});
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* optional */ }
    setActive(TIPS[0].id);
  }, []);

  // Show a tip the first time its section is reached (pull, non-blocking).
  const seenRef = useRef(seen);
  useEffect(() => { seenRef.current = seen; }, [seen]);
  const show = useCallback((id) => {
    if (seenRef.current[id]) return;
    setActive(id);
  }, []);

  const value = useMemo(() => ({ seen, active, dismiss, replay, show }), [seen, active, dismiss, replay, show]);
  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

/** Observes the key sections and surfaces each tip once, in context. */
export function CoachmarkTriggers() {
  const { show } = useGuide();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const tip = TIPS.find((t) => t.section === entry.target.id);
          if (tip) show(tip.id);
        }
      },
      { threshold: 0.15 },
    );
    for (const tip of TIPS) {
      const el = document.getElementById(tip.section);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [show]);
  return null;
}

/** The anchored coachmark card + highlight ring (non-blocking). */
export function Coachmark() {
  const { t } = useTranslation();
  const { active, dismiss } = useGuide();
  const [rect, setRect] = useState(null);
  const tip = TIPS.find((x) => x.id === active);

  useEffect(() => {
    if (!tip) { setRect(null); return undefined; }
    const el = document.querySelector(tip.target) || document.getElementById(tip.section);
    if (!el) { setRect(null); return undefined; }
    const place = () => {
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height, bottom: r.bottom });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, { passive: true });
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place);
    };
  }, [tip]);

  if (!tip || !rect) return null;
  const cardTop = Math.min(rect.bottom + 12, window.innerHeight - 180);

  return (
    <>
      <div className="coachmark-ring" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} aria-hidden="true" />
      <Card className="coachmark" elevation={4} style={{ left: Math.max(12, Math.min(rect.left, window.innerWidth - 320)), top: cardTop }} role="dialog" aria-label={t('guide.tour')}>
        <div className="coachmark-title">{t(tip.title)}</div>
        <p className="coachmark-body">{t(tip.body)}</p>
        <div className="coachmark-actions">
          <Button small variant="outlined" text={t('guide.skip')} onClick={() => dismiss(tip.id)} />
          <Button small intent="primary" text={t('guide.gotIt')} onClick={() => dismiss(tip.id)} />
        </div>
      </Card>
    </>
  );
}

/** Small opt-in beacon to start/replay the guidance. */
export function TourBeacon() {
  const { t } = useTranslation();
  const { replay } = useGuide();
  return (
    <button type="button" className="tour-beacon" onClick={replay} aria-label={t('guide.tour')} title={t('guide.tour')} data-testid="tour-beacon">
      ?
    </button>
  );
}