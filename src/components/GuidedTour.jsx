import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useTour } from '../context/TourContext';
import { Meter } from './ui';

const STORAGE_KEY = 'sothis-echo-tour-seen';

const STEPS = [
  { id: 'mission', key: 'mission' },
  { id: 'see-through', key: 'seeThrough' },
  { id: 'sites', key: 'sites' },
  { id: 'sound', key: 'sound' },
  { id: 'game', key: 'game' },
];

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

// place the card BESIDE the target (never on top of it), then below/above
function computePlacement(el, card) {
  const r = el.getBoundingClientRect();
  const cw = card.offsetWidth || 340;
  const ch = card.offsetHeight || 200;
  const M = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rtl = document.documentElement.getAttribute('dir') === 'rtl';
  const sideEnd = rtl ? r.left - cw - 14 : r.right + 14;
  const sideStart = rtl ? r.right + 14 : r.left - cw - 14;
  const midTop = clamp(r.top + r.height / 2 - ch / 2, M, Math.max(M, vh - ch - M));
  if (sideEnd >= M && sideEnd + cw <= vw - M) return { left: sideEnd, top: midTop };
  if (sideStart >= M && sideStart + cw <= vw - M) return { left: sideStart, top: midTop };
  const left = clamp(r.left + r.width / 2 - cw / 2, M, Math.max(M, vw - cw - M));
  const below = r.bottom + 14;
  const above = r.top - ch - 14;
  if (below + ch <= vh - M) return { left, top: below };
  if (above >= M) return { left, top: above };
  return { left, top: midTop };
}

export default function GuidedTour() {
  const { t } = useTranslation();
  const { request } = useTour();
  const [active, setActive] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });
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
    const el = document.getElementById(STEPS[step]?.id);
    if (!el) return undefined;

    targetRef.current?.classList.remove('tour-spot-highlight');
    targetRef.current = el;
    el.classList.add('tour-spot-highlight');

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    const timer = setTimeout(() => {
      if (!cardRef.current) return;
      setPos(computePlacement(el, cardRef.current));
      setReady(true);
    }, reduce ? 60 : 420);
    return () => clearTimeout(timer);
  }, [active, step]);

  // keep the card glued to its target while the page scrolls or resizes
  useEffect(() => {
    if (!active) return undefined;
    const reposition = () => {
      const el = document.getElementById(STEPS[step]?.id);
      if (el && cardRef.current) setPos(computePlacement(el, cardRef.current));
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
      if (!['Escape', 'ArrowRight', 'ArrowLeft'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') next();
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
          <div className="tour-spot-backdrop" onClick={close} aria-hidden="true" />
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
