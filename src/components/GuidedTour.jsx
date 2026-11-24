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
  { id: 'atlas', key: 'atlas', target: '#atlas .atlas-cards' },
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

const GAP = 16; // gap between the highlighted control and the docked card
const TOP_PAD = 12; // keep the control off the top edge of the screen
const SPOT_PAD = 8; // breathing room around the spotlight

// The card is docked at the bottom for every step, so the only thing that can
// move is how far the page scrolls: bring the control into the free band above
// the card, and leave it alone when it is already there.
function revealAboveDock(el, card) {
  const vh = window.innerHeight;
  const cardH = card?.offsetHeight || 240;
  const limit = vh - cardH - GAP; // top edge of the docked card
  const r = el.getBoundingClientRect();
  if (r.top >= TOP_PAD && r.bottom <= limit) return 0;
  const band = Math.max(1, limit - TOP_PAD);
  const desired = TOP_PAD + Math.max(0, (band - r.height) / 2);
  return Math.round(r.top - Math.min(desired, Math.max(TOP_PAD, limit - r.height)));
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

  // spotlight for the current step, with the control scrolled clear of the dock
  useEffect(() => {
    if (!active) return undefined;
    const el = targetEl(step);
    if (!el) return undefined;

    targetRef.current?.classList.remove('tour-spot-highlight');
    targetRef.current = el;
    el.classList.add('tour-spot-highlight');

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const place = () => {
      setSpot(spotRect(el));
      setReady(true);
    };
    const reveal = () => {
      const delta = revealAboveDock(el, cardRef.current);
      if (Math.abs(delta) > 1) {
        window.scrollBy({ top: delta, behavior: reduce ? 'auto' : 'smooth' });
      }
    };
    reveal();
    place();
    const timer = setTimeout(() => {
      reveal();
      place();
    }, reduce ? 60 : 420);
    return () => clearTimeout(timer);
  }, [active, step]);

  // keep the spotlight glued to its control while the page scrolls or resizes
  useEffect(() => {
    if (!active) return undefined;
    const reposition = () => {
      const el = targetEl(step);
      if (el) setSpot(spotRect(el));
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
