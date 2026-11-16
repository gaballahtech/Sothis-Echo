import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useTour } from '../context/TourContext';
import { Meter } from './ui';

const STORAGE_KEY = 'sothis-echo-tour-seen';

// Each step points at the control the visitor is meant to try, not the whole
// chapter: a section is taller than the viewport, so a card anchored to it can
// only ever sit on top of the very thing it is describing.
const STEPS = [
  { id: 'mission', key: 'mission', target: '#mission .mission-details' },
  { id: 'see-through', key: 'seeThrough', target: '#see-through .compare-frame' },
  { id: 'sites', key: 'sites', target: '#sites .site-tabs' },
  { id: 'sound', key: 'sound', target: '#sound .sound-actions-bar' },
  { id: 'game', key: 'game', target: '#game .app-panel' },
];

function targetEl(index) {
  const step = STEPS[index];
  if (!step) return null;
  return document.querySelector(step.target) || document.getElementById(step.id);
}

function readSeen() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* storage is optional */
  }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const EDGE = 12; // keep the card off the viewport edge
const GAP = 16; // distance between the highlighted control and the card
const SPOT_PAD = 8; // breathing room around the spotlight

// Place the card beside the target first, then below/above it, so it never
// covers the control the visitor is being asked to try.
function computePlacement(el, card) {
  const r = el.getBoundingClientRect();
  const cw = card.offsetWidth || 340;
  const ch = card.offsetHeight || 220;
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = window.innerHeight;
  const maxLeft = Math.max(EDGE, vw - cw - EDGE);
  const maxTop = Math.max(EDGE, vh - ch - EDGE);
  const midTop = clamp(r.top + r.height / 2 - ch / 2, EDGE, maxTop);
  const midLeft = clamp(r.left + r.width / 2 - cw / 2, EDGE, maxLeft);
  const fits = (left, top) =>
    left >= EDGE && top >= EDGE && left + cw <= vw - EDGE && top + ch <= vh - EDGE;

  const candidates = [
    { left: r.right + GAP, top: midTop }, // inline-end side
    { left: r.left - cw - GAP, top: midTop }, // inline-start side
    { left: midLeft, top: r.bottom + GAP }, // below
    { left: midLeft, top: r.top - ch - GAP }, // above
  ];
  const placed = candidates.find((c) => fits(c.left, c.top));
  if (placed) return placed;

  // Last resort (a target that fills the viewport): dock in whichever corner
  // the target leaves free, never centred over its controls.
  const visible = {
    left: clamp(r.left, 0, vw),
    right: clamp(r.right, 0, vw),
    top: clamp(r.top, 0, vh),
    bottom: clamp(r.bottom, 0, vh),
  };
  return {
    left: vw - visible.right >= visible.left ? maxLeft : EDGE,
    top: vh - visible.bottom >= visible.top ? maxTop : EDGE,
  };
}

function spotRect(el) {
  const r = el.getBoundingClientRect();
  return {
    left: r.left - SPOT_PAD,
    top: r.top - SPOT_PAD,
    width: r.width + SPOT_PAD * 2,
    height: r.height + SPOT_PAD * 2,
  };
}

export default function GuidedTour() {
  const { t } = useTranslation();
  const { request } = useTour();
  const [active, setActive] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });
  const [spot, setSpot] = useState(null);
  const [ready, setReady] = useState(false);
  const cardRef = useRef(null);
  const targetRef = useRef(null);
  const firstRequest = useRef(request);

  const start = useCallback(() => {
    markSeen();
    setPrompt(false);
    setStep(0);
    setActive(true);
  }, []);

  const close = useCallback(() => {
    markSeen();
    setActive(false);
    setPrompt(false);
  }, []);

  const next = useCallback(() => {
    if (step >= STEPS.length - 1) {
      markSeen();
      setActive(false);
      return;
    }
    setStep(step + 1);
  }, [step]);

  const back = useCallback(() => setStep((current) => Math.max(0, current - 1)), []);

  useEffect(() => {
    if (active || readSeen()) {
      setPrompt(false);
      return undefined;
    }
    const timer = setTimeout(() => setPrompt(true), 1600);
    return () => clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    if (request === firstRequest.current) return;
    firstRequest.current = request;
    start();
  }, [request, start]);

  // spotlight + anchored placement for the current step
  useEffect(() => {
    if (!active) return undefined;
    const el = targetEl(step);
    if (!el) return undefined;

    targetRef.current?.classList.remove('tour-spot-highlight');
    targetRef.current = el;
    el.classList.add('tour-spot-highlight');

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    const place = () => {
      if (!cardRef.current) return;
      setSpot(spotRect(el));
      setPos(computePlacement(el, cardRef.current));
      setReady(true);
    };
    place();
    const timer = setTimeout(place, reduce ? 60 : 420);
    return () => clearTimeout(timer);
  }, [active, step]);

  // keep the card glued to its target while the page scrolls or resizes
  useEffect(() => {
    if (!active) return undefined;
    const reposition = () => {
      const el = targetEl(step);
      if (!el) return;
      setSpot(spotRect(el));
      if (cardRef.current) setPos(computePlacement(el, cardRef.current));
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, { passive: true });
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition);
    };
  }, [active, step]);

  useEffect(() => {
    if (!active) return undefined;
    return () => {
      targetRef.current?.classList.remove('tour-spot-highlight');
      targetRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      // Arrow keys belong to the page controls the visitor is trying; only
      // step the tour when focus is inside its own card.
      if (!cardRef.current?.contains(event.target)) return;
      event.preventDefault();
      if (event.key === 'ArrowRight') next();
      else back();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, close, next, back]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {prompt && !active ? (
        <Card className="tour-prompt" elevation={3} data-testid="tour-prompt">
          <div className="row" style={{ marginBottom: 8 }}>
            <Tag minimal intent="primary">{t('tour.badge')}</Tag>
          </div>
          <p style={{ marginBottom: 3, fontSize: 14, fontWeight: 600 }}>{t('tour.promptTitle')}</p>
          <p className="body-copy-muted" style={{ marginBottom: 10 }}>{t('tour.promptBody')}</p>
          <div className="row">
            <Button intent="primary" small text={t('tour.start')} onClick={start} data-testid="tour-start" />
            <Button variant="minimal" small text={t('tour.dismiss')} onClick={close} data-testid="tour-dismiss" />
          </div>
        </Card>
      ) : null}

      {active ? (
        <>
          {spot ? <div className="tour-spot-veil" style={spot} aria-hidden="true" /> : null}
          <div
            ref={cardRef}
            className="tour-spot"
            role="dialog"
            aria-label={t('tour.stepLabel', { current: step + 1, total: STEPS.length })}
            style={{
              left: pos.left,
              top: pos.top,
              opacity: ready ? 1 : 0,
              pointerEvents: ready ? 'auto' : 'none',
            }}
          >
            <Card elevation={4}>
              <div data-testid="tour-card" aria-live="polite">
                <div className="row" style={{ marginBottom: 6, justifyContent: 'space-between' }}>
                  <Tag minimal intent="primary">{t('tour.stepOf', { current: step + 1, total: STEPS.length })}</Tag>
                  <Button
                    variant="minimal"
                    small
                    icon="cross"
                    aria-label={t('tour.dismiss')}
                    onClick={close}
                    style={{ minHeight: 24 }}
                  />
                </div>
                <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600 }}>
                  {t(`tour.steps.${current.key}.title`)}
                </h2>
                <p className="body-copy-muted" style={{ marginBottom: 8 }}>
                  {t(`tour.steps.${current.key}.body`)}
                </p>
                <Meter
                  value={(step + 1) / STEPS.length}
                  className="tour-progress"
                  label={t('tour.stepOf', { current: step + 1, total: STEPS.length })}
                />
              </div>
              <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                <Button
                  variant="outlined"
                  small
                  text={t('tour.back')}
                  disabled={step === 0}
                  onClick={back}
                  data-testid="tour-back"
                />
                <Button
                  intent="primary"
                  small
                  text={isLast ? t('tour.finish') : t('tour.next')}
                  onClick={next}
                  data-testid="tour-next"
                />
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </>
  );
}
