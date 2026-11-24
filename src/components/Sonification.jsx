import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonGroup, Callout } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { createSonifier, isAudioSupported } from '../services/sonifier';
import { SectionHead } from './ui';
import PulseTrace from './PulseTrace';

export default function Sonification({ embedded = false, siteId: forcedSiteId }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, source, loading } = useSiteData();
  const [localSiteId, setLocalSiteId] = useState(() => sites[0]?.id);
  const activeId = forcedSiteId ?? localSiteId;
  const [playing, setPlaying] = useState(false);
  const [booting, setBooting] = useState(false);
  const [step, setStep] = useState(-1);
  const [supported, setSupported] = useState(true);
  const sonifierRef = useRef(null);

  const site = sites.find((item) => item.id === activeId) ?? sites[0];
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
    setPlaying(false);
    setStep(-1);
  }, [activeId]);

  const mapping = useMemo(
    () => [t('sound.map1'), t('sound.map2'), t('sound.map3'), t('sound.map4')],
    [t]
  );

  const audioValues = useMemo(() => {
    const pulse = site?.pulse ?? [];
    const peak = Math.max(0, ...pulse.map((value) => Math.max(0, Number(value) || 0)));
    if (peak <= 0) return pulse;
    return pulse.map((value) => Math.min(1, Math.max(0, Number(value) || 0) / peak));
  }, [site]);

  if (!site) return null;

  const stop = () => {
    sonifierRef.current?.stop();
    setPlaying(false);
    setStep(-1);
  };

  const toggle = () => {
    if (booting) return;
    if (playing) {
      stop();
      return;
    }
    // the sonifier "warms up" — spinner + wave pulse inside the button
    setBooting(true);
    window.setTimeout(() => {
      setStep(0);
      setPlaying(true);
      const ok = sonifierRef.current?.play(audioValues, {
        onStep: setStep,
        onEnd: () => {
          setPlaying(false);
          setStep(-1);
        },
      });
      setBooting(false);
      if (!ok) {
        setSupported(false);
        setPlaying(false);
        setStep(-1);
      }
    }, 620);
  };

  return (
    <section
      id={embedded ? undefined : 'sound'}
      className={`content-section chapter chapter--gold${embedded ? ' casefile-facet' : ''}`}
      aria-labelledby={embedded ? undefined : 'sound-title'}
    >
      <div className="section-inner">
        {!embedded ? <SectionHead title={t('sound.title')} subtitle={t('sound.subtitle')} id="sound-title" /> : null}

        {!embedded ? (
          <div className="row site-choice-row" role="group" aria-label={t('common.sitePicker')}>
            <span className="site-choice-label">{t('common.sitePicker')}</span>
            <ButtonGroup className="site-choice">
              {sites.map((item) => (
                <Button
                  key={item.id}
                  active={item.id === site.id}
                  variant={item.id === site.id ? 'solid' : 'outlined'}
                  text={localized(item.name, language)}
                  onClick={() => setLocalSiteId(item.id)}
                  aria-pressed={item.id === site.id}
                />
              ))}
            </ButtonGroup>
          </div>
        ) : null}

        <div className="sound-actions-bar" role="group" aria-label={t('sound.title')}>
          <Button
            className={`sound-action-btn${booting ? ' is-booting' : ''}`}
            intent={playing ? 'warning' : 'none'}
            variant="outlined"
            icon={booting ? undefined : playing ? 'stop' : 'play'}
            loading={booting}
            text={
              playing
                ? t('sound.stop')
                : `${t('sound.changeTitle')} — ${siteName}`
            }
            onClick={toggle}
            disabled={!supported}
            aria-pressed={playing}
            data-testid="sound-play-change"
          />
        </div>

        <p className="sound-status" data-testid="sound-status" aria-live="polite">
          {playing
            ? t('sound.nowPlaying', { current: step + 1, total: site.pulse.length })
            : null}
        </p>
      </div>

      <div className="sound-stage">
        <PulseTrace values={site.pulse} currentPassIndex={step} playing={playing} />
      </div>

      <div className="section-inner">
        <p className="micro sound-source" data-testid="sound-source">
          {loading
            ? t('common.checkingLive')
            : source === 'api'
              ? t('sound.sourceLine', { passes: site.series?.length ?? 0 })
              : t('sites.localData')}
        </p>
      </div>

      <div className="section-inner">
        <div className="sound-map-strip" aria-label={t('sound.mappingTitle')}>
          {mapping.map((line) => (
            <div key={line} className="sound-map-item">
              {line}
            </div>
          ))}
        </div>

        {!supported ? (
          <Callout intent="warning" icon="warning-sign" style={{ marginTop: 12 }}>
            {t('sound.noSupport')}
          </Callout>
        ) : null}
      </div>
    </section>
  );
}
