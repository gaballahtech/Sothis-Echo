import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonGroup, Callout } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { createSonifier, isAudioSupported } from '../services/sonifier';
import { Panel, SectionHead } from './ui';

function PulseStrip({ values, active = -1, tall = false, change = false }) {
  return (
    <div className={`pulse-strip ${tall ? 'tall' : ''}`} aria-hidden="true">
      {values.map((value, index) => {
        const height = 6 + Math.max(0, Math.min(1, value)) * 94;
        const isActive = index === active;
        return (
          <span
            key={index}
            className={`pulse-bar ${change ? 'change' : ''} ${isActive ? 'active' : ''}`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

function TrackCard({ title, subtitle, values, playing, supported, onToggle, playLabel, stopLabel, change, testKey }) {
  return (
    <Panel
      title={title}
      icon={change ? 'changes' : 'history'}
      status={playing ? 'PLAYING' : 'IDLE'}
      tone={playing ? 'primary' : 'default'}
      className="track-card"
      bodyClassName="card-pad"
    >
      <p className="body-copy-muted" style={{ marginBottom: 8 }}>{subtitle}</p>
      <PulseStrip values={values} change={change} />
      <div className="sound-actions">
        <Button
          fill
          intent={playing ? 'warning' : undefined}
          variant={playing ? 'solid' : 'outlined'}
          icon={playing ? 'stop' : 'play'}
          text={playing ? stopLabel : playLabel}
          onClick={onToggle}
          disabled={!supported}
          aria-pressed={playing}
          data-testid={`sound-play-${testKey}`}
        />
      </div>
    </Panel>
  );
}

export default function Sonification() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites } = useSiteData();
  const [siteId, setSiteId] = useState(() => sites[0]?.id);
  const [track, setTrack] = useState(null);
  const [step, setStep] = useState(-1);
  const [supported, setSupported] = useState(true);
  const sonifierRef = useRef(null);

  const site = sites.find((item) => item.id === siteId) ?? sites[0];
  const siteName = localized(site?.name, language);

  useEffect(() => {
    if (!isAudioSupported()) {
      setSupported(false);
      return undefined;
    }
    const sonifier = createSonifier();
    sonifierRef.current = sonifier;
    return () => {
      sonifier.dispose();
      sonifierRef.current = null;
    };
  }, []);

  useEffect(() => {
    sonifierRef.current?.stop();
    setTrack(null);
    setStep(-1);
  }, [siteId]);

  const mapping = useMemo(
    () => [t('sound.map1'), t('sound.map2'), t('sound.map3'), t('sound.map4')],
    [t]
  );

  if (!site) return null;

  const stop = () => {
    sonifierRef.current?.stop();
    setTrack(null);
    setStep(-1);
  };

  const toggle = (key) => {
    if (track === key) {
      stop();
      return;
    }
    sonifierRef.current?.stop();
    setStep(0);
    setTrack(key);
    const values = key === 'stable' ? site.stablePulse : site.pulse;
    const ok = sonifierRef.current?.play(values, {
      onStep: setStep,
      onEnd: () => {
        setTrack(null);
        setStep(-1);
      },
    });
    if (!ok) {
      setSupported(false);
      setTrack(null);
      setStep(-1);
    }
  };

  const visualValues = track === 'stable' ? site.stablePulse : site.pulse;
  const eventIndex = site.pulse.reduce((best, value, index) => (value > site.pulse[best] ? index : best), 0);

  return (
    <section id="sound" className="content-section chapter chapter--gold" aria-labelledby="sound-title">
      <div className="section-inner">
        <SectionHead kicker={t('sound.kicker')} title={t('sound.title')} subtitle={t('sound.subtitle')} id="sound-title" />

        <div className="row" style={{ marginBottom: 12 }}>
          <span className="micro">{t('sound.sitePicker')}</span>
          <ButtonGroup>
            {sites.map((item) => (
              <Button
                key={item.id}
                small
                active={item.id === site.id}
                variant={item.id === site.id ? 'solid' : 'outlined'}
                text={localized(item.name, language)}
                onClick={() => setSiteId(item.id)}
                aria-pressed={item.id === site.id}
              />
            ))}
          </ButtonGroup>
        </div>

        <div className="grid-2">
          <TrackCard
            title={t('sound.stableTitle')}
            subtitle={t('sound.stableSub')}
            values={site.stablePulse}
            playing={track === 'stable'}
            supported={supported}
            onToggle={() => toggle('stable')}
            playLabel={t('sound.play')}
            stopLabel={t('sound.stop')}
            testKey="stable"
          />
          <TrackCard
            title={`${t('sound.changeTitle')} — ${siteName}`}
            subtitle={t('sound.changeSub')}
            values={site.pulse}
            playing={track === 'change'}
            supported={supported}
            onToggle={() => toggle('change')}
            playLabel={t('sound.play')}
            stopLabel={t('sound.stop')}
            change
            testKey="change"
          />
        </div>

        <div className="sound-map-strip" aria-label={t('sound.mappingTitle')}>
          {mapping.map((line, index) => (
            <div key={line} className="sound-map-item">
              <span className="sound-map-index">0{index + 1}</span>
              <span>{line}</span>
            </div>
          ))}
        </div>

        {!supported ? (
          <Callout intent="warning" icon="warning-sign" style={{ marginTop: 12 }}>
            {t('sound.noSupport')}
          </Callout>
        ) : null}

        <Panel
          title={`${t('sound.visualTitle')} · ${siteName}`}
          icon="chart"
          status={track ? t('sound.passOf', { current: step + 1, total: visualValues.length }) : 'IDLE'}
          bodyClassName="card-pad"
          className="sound-visual"
        >
          <PulseStrip values={visualValues} active={step} tall change={track === 'change'} />
          <div className="row-between" style={{ marginTop: 2 }}>
            <span className="micro">01</span>
            <span className="micro" style={{ color: 'var(--bp-intent-warning-rest)' }}>{t('sound.eventMarker')}</span>
            <span className="micro">16</span>
          </div>
          <p className="sound-status" data-testid="sound-status" aria-live="polite">
            {track ? t('sound.nowPlaying', { current: step + 1, total: visualValues.length }) : t('sound.hint')}
          </p>
        </Panel>

        <p className="bp6-text-muted" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {track ? t('sound.nowPlaying', { current: step + 1, total: visualValues.length }) : ''}
        </p>
      </div>
    </section>
  );
}
