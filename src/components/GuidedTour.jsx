import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogFooter,
  Icon,
  Tag,
} from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useMode } from '../context/ModeContext';
import { useTour } from '../context/TourContext';
import { Meter } from './ui';

const STORAGE_KEY = 'dancing-with-sar-tour-seen';

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

export default function GuidedTour() {
  const { t } = useTranslation();
  const { mode } = useMode();
  const { request } = useTour();
  const [active, setActive] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [step, setStep] = useState(0);
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
    if (active || readSeen() || mode !== 'public') {
      setPrompt(false);
      return undefined;
    }
    const timer = setTimeout(() => setPrompt(true), 1600);
    return () => clearTimeout(timer);
  }, [mode, active]);

  useEffect(() => {
    if (request === firstRequest.current) return;
    firstRequest.current = request;
    start();
  }, [request, start]);

  useEffect(() => {
    if (mode === 'public') return;
    setActive(false);
    setPrompt(false);
  }, [mode]);

  useEffect(() => {
    if (!active) return;
    const target = STEPS[step]?.id;
    if (!target) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 160);
    return () => clearTimeout(timer);
  }, [active, step]);

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
            <Tag minimal intent="primary" icon="help">{t('tour.badge')}</Tag>
          </div>
          <p style={{ marginBottom: 3, fontSize: 14, fontWeight: 600 }}>{t('tour.promptTitle')}</p>
          <p className="body-copy-muted" style={{ marginBottom: 10 }}>{t('tour.promptBody')}</p>
          <div className="row">
            <Button intent="primary" small text={t('tour.start')} onClick={start} data-testid="tour-start" />
            <Button variant="minimal" small text={t('tour.dismiss')} onClick={close} data-testid="tour-dismiss" />
          </div>
        </Card>
      ) : null}

      {!active ? (
        <Button
          className="tour-help"
          icon="help"
          aria-label={t('tour.help')}
          title={t('tour.help')}
          onClick={start}
          data-testid="tour-help"
        />
      ) : null}

      <Dialog
        isOpen={active}
        onClose={close}
        title={t('tour.stepLabel', { current: step + 1, total: STEPS.length })}
        icon="help"
        className="tour-dialog"
        canEscapeKeyClose
        canOutsideClickClose
      >
        <DialogBody>
          <div data-testid="tour-card" aria-live="polite">
            <div className="row" style={{ marginBottom: 6 }}>
              <span className="micro">{t('tour.stepOf', { current: step + 1, total: STEPS.length })}</span>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 600 }}>{t(`tour.steps.${current.key}.title`)}</h2>
            <p className="body-copy-muted" style={{ marginBottom: 8 }}>{t(`tour.steps.${current.key}.body`)}</p>
            <Meter value={(step + 1) / STEPS.length} className="tour-progress" label={t('tour.stepOf', { current: step + 1, total: STEPS.length })} />
            <div className="row">
              <Icon icon="info-sign" size={12} aria-hidden="true" className="muted" />
              <span className="micro">{t('tour.help')}</span>
            </div>
          </div>
        </DialogBody>
        <DialogFooter
          actions={
            <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
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
          }
        />
      </Dialog>
    </>
  );
}
